$ErrorActionPreference = 'SilentlyContinue'

$services = @(
    @{ Name = 'financeX-ui'; Port = 4173 },
    @{ Name = 'financeX-core'; Port = 8080 },
    @{ Name = 'user-service'; Port = 8081 },
    @{ Name = 'expense-service'; Port = 8082 },
    @{ Name = 'p2p-service'; Port = 8084 },
    @{ Name = 'creditcard-service'; Port = 8086 }
)

Write-Host 'FinanceX status'
Write-Host '---------------'
foreach ($service in $services) {
    $connection = Get-NetTCPConnection -State Listen -LocalPort $service.Port | Select-Object -First 1
    if ($connection) {
        Write-Host ("{0,-20} RUNNING  port {1}  PID {2}" -f $service.Name, $service.Port, $connection.OwningProcess) -ForegroundColor Green
    } else {
        Write-Host ("{0,-20} STOPPED  port {1}" -f $service.Name, $service.Port) -ForegroundColor Red
    }
}

Write-Host ''
$tunnels = Get-CimInstance Win32_Process -Filter "Name = 'cloudflared.exe' OR Name = 'ngrok.exe' OR Name = 'lt.exe' OR Name = 'ssh.exe'" |
    Where-Object { $_.CommandLine -match 'serveo|cloudflared|ngrok|localtunnel|5173' }
if ($tunnels) {
    $tunnels | ForEach-Object { Write-Host "Tunnel RUNNING  $($_.Name)  PID $($_.ProcessId)" -ForegroundColor Green }
} else {
    Write-Host 'Tunnel STOPPED' -ForegroundColor Yellow
}