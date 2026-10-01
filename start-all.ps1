$ErrorActionPreference = 'Stop'

$root = $PSScriptRoot
$logDir = Join-Path $root 'logs'
$jdk = 'C:\Program Files\Microsoft\jdk-21.0.12.101-hotspot'
$node = 'C:\Program Files\nodejs'
$maven = Get-ChildItem 'C:\Users\Saksham Kumar\.m2\wrapper\dists\apache-maven-3.9.10' -Filter 'mvn.cmd' -Recurse -ErrorAction SilentlyContinue |
    Select-Object -First 1 -ExpandProperty FullName

if (-not (Test-Path (Join-Path $jdk 'bin\java.exe'))) {
    throw "JDK 21 was not found at $jdk"
}
if (-not $maven) {
    throw 'Maven 3.9.10 was not found in the local Maven wrapper cache.'
}
if (-not (Test-Path (Join-Path $node 'npm.cmd'))) {
    throw "Node.js was not found at $node"
}

New-Item -ItemType Directory -Force -Path $logDir | Out-Null
$env:JAVA_HOME = $jdk
$env:Path = "$jdk\bin;$node;$env:Path"

$envFile = Join-Path $root '.env'
if (Test-Path $envFile) {
    Get-Content $envFile | ForEach-Object {
        if ($_ -match '^\s*([^#=][^=]*)=(.*)$') {
            $name = $matches[1].Trim()
            $value = $matches[2].Trim().Trim('"')
            [Environment]::SetEnvironmentVariable($name, $value, 'Process')
        }
    }
}

function Test-PortInUse($port) {
    return [bool](Get-NetTCPConnection -State Listen -LocalPort $port -ErrorAction SilentlyContinue)
}

function Start-Backend($name, $directory, $port) {
    if (Test-PortInUse $port) {
        Write-Host "[ALREADY RUNNING] $name on port $port"
        return
    }

    $serviceRoot = Join-Path $root $directory
    $stdout = Join-Path $logDir "$name.log"
    $stderr = Join-Path $logDir "$name.err.log"
    $command = "& '$maven' spring-boot:run"
    Start-Process -FilePath 'powershell.exe' `
        -ArgumentList '-NoProfile', '-ExecutionPolicy', 'Bypass', '-Command', $command `
        -WorkingDirectory $serviceRoot `
        -RedirectStandardOutput $stdout `
        -RedirectStandardError $stderr `
        -WindowStyle Hidden | Out-Null
    Write-Host "[STARTING] $name on port $port"
}

Start-Backend 'user-service' 'user-service' 8081
Start-Backend 'expense-service' 'expense-service' 8082
Start-Backend 'p2p-service' 'p2p-service' 8084
Start-Backend 'creditcard-service' 'creditcard-service' 8086
Start-Backend 'financeX-core' 'financeX-core' 8080

if (Test-PortInUse 5173) {
    Write-Host '[ALREADY RUNNING] financeX-ui on port 5173'
} else {
    $uiRoot = Join-Path $root 'financeX-ui'
    Start-Process -FilePath 'powershell.exe' `
        -ArgumentList '-NoProfile', '-ExecutionPolicy', 'Bypass', '-Command', "& '$node\npm.cmd' run preview -- --host 0.0.0.0" `
        -WorkingDirectory $uiRoot `
        -RedirectStandardOutput (Join-Path $logDir 'financeX-ui.log') `
        -RedirectStandardError (Join-Path $logDir 'financeX-ui.err.log') `
        -WindowStyle Hidden | Out-Null
    Write-Host '[STARTING] financeX-ui on port 4173'
}

Write-Host ''
Write-Host 'FinanceX launch requests submitted.'
Write-Host 'UI: http://localhost:4173'
Write-Host "Logs: $logDir"