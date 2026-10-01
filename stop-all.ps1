$ErrorActionPreference = 'SilentlyContinue'

$ports = 4173, 8080, 8081, 8082, 8084, 8086
$names = @{
    4173 = 'financeX-ui'
    8080 = 'financeX-core'
    8081 = 'user-service'
    8082 = 'expense-service'
    8084 = 'p2p-service'
    8086 = 'creditcard-service'
}

Write-Host 'Stopping FinanceX processes...'

foreach ($port in $ports) {
    $connections = Get-NetTCPConnection -State Listen -LocalPort $port
    $processIds = @($connections | Select-Object -ExpandProperty OwningProcess -Unique)
    if ($processIds.Count -eq 0) {
        Write-Host "[NOT RUNNING] $($names[$port]) on port $port"
        continue
    }

    foreach ($processId in $processIds) {
        Stop-Process -Id $processId -Force
        Write-Host "[STOPPED] $($names[$port]) on port $port (PID $processId)"
    }
}

# Stop tunnel clients used for FinanceX without touching unrelated SSH sessions.
Get-CimInstance Win32_Process -Filter "Name = 'cloudflared.exe' OR Name = 'ngrok.exe' OR Name = 'lt.exe'" |
    Where-Object { $_.CommandLine -match '4173|FinanceX|financeX' } |
    ForEach-Object {
        Stop-Process -Id $_.ProcessId -Force
        Write-Host "[STOPPED] tunnel process PID $($_.ProcessId)"
    }

Write-Host 'FinanceX stop complete. PostgreSQL on port 5432 was left running.'