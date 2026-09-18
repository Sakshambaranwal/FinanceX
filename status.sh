#!/bin/bash

echo "========================================================"
echo " FinanceApp Service Status"
echo "========================================================"

check_status() {
    local name=$1
    local port=$2
    local pid=$(lsof -ti :$port 2>/dev/null)
    if [ -n "$pid" ]; then
        printf " %-22s : \033[0;32mRUNNING\033[0m (Port %d, PID %s)\n" "$name" "$port" "$pid"
    else
        printf " %-22s : \033[0;31mSTOPPED\033[0m (Port %d)\n" "$name" "$port"
    fi
}

check_status "financeX-ui" 5173
check_status "financeX-core (Gateway)" 8080
check_status "user-service" 8081
check_status "expense-service" 8082
check_status "p2p-service" 8084
check_status "creditcard-service" 8086

# Check cloudflared
cf_pid=$(pgrep cloudflared 2>/dev/null)
if [ -n "$cf_pid" ]; then
    printf " %-22s : \033[0;32mRUNNING\033[0m (PID %s)\n" "cloudflared tunnel" "$cf_pid"
else
    printf " %-22s : \033[0;31mSTOPPED\033[0m\n" "cloudflared tunnel"
fi

echo "========================================================"

