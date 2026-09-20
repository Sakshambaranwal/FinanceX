#!/bin/bash

DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

if [ -f "$DIR/.env" ]; then
    set -a
    source "$DIR/.env"
    set +a
fi

echo "========================================================"
echo " FinanceApp Service Status"
echo "========================================================"

USER_PORT="${USER_SERVICE_PORT:-8081}"
EXPENSE_PORT="${EXPENSE_SERVICE_PORT:-8082}"
P2P_PORT="${P2P_SERVICE_PORT:-8084}"
CC_PORT="${CREDITCARD_SERVICE_PORT:-8086}"
GATEWAY_P="${GATEWAY_PORT:-8080}"
FRONTEND_P="${FRONTEND_PORT:-5173}"

check_status() {
    local name=$1
    local port=$2
    local pid=$(lsof -ti :$port 2>/dev/null)
    if [ -n "$pid" ]; then
        printf " %-24s : \033[0;32mRUNNING\033[0m (Port %s, PID %s)\n" "$name" "$port" "$pid"
    else
        printf " %-24s : \033[0;31mSTOPPED\033[0m (Port %s)\n" "$name" "$port"
    fi
}

check_status "financeX-ui" "$FRONTEND_P"
check_status "financeX-core (Gateway)" "$GATEWAY_P"
check_status "user-service" "$USER_PORT"
check_status "expense-service" "$EXPENSE_PORT"
check_status "p2p-service" "$P2P_PORT"
check_status "creditcard-service" "$CC_PORT"

# Check cloudflared
cf_pid=$(pgrep cloudflared 2>/dev/null | head -n 1)
if [ -n "$cf_pid" ]; then
    cf_port=$(lsof -Pan -p "$cf_pid" -iTCP -sTCP:LISTEN 2>/dev/null | awk 'NR>1 {print $9}' | cut -d: -f2 | head -n 1)
    cf_url=""
    if [ -n "$cf_port" ]; then
        cf_host=$(curl -s --max-time 1 "http://localhost:$cf_port/quicktunnel" 2>/dev/null | grep -o '"hostname":"[^"]*"' | cut -d'"' -f4)
        if [ -n "$cf_host" ]; then
            cf_url="https://$cf_host"
        fi
    fi
    if [ -n "$cf_url" ]; then
        printf " %-24s : \033[0;32mRUNNING\033[0m (PID %s)\n" "cloudflared tunnel" "$cf_pid"
        printf "   \033[1;36m➜ Public Cloudflare URL\033[0m : \033[1;32m%s\033[0m\n" "$cf_url"
    else
        printf " %-24s : \033[0;32mRUNNING\033[0m (PID %s)\n" "cloudflared tunnel" "$cf_pid"
    fi
else
    printf " %-24s : \033[0;31mSTOPPED\033[0m\n" "cloudflared tunnel"
fi

echo "========================================================"
