#!/bin/bash

DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

if [ -f "$DIR/.env" ]; then
    set -a
    source "$DIR/.env"
    set +a
fi

echo "========================================================"
echo " Stopping all FinanceApp Services..."
echo "========================================================"

USER_PORT="${USER_SERVICE_PORT:-8081}"
EXPENSE_PORT="${EXPENSE_SERVICE_PORT:-8082}"
P2P_PORT="${P2P_SERVICE_PORT:-8084}"
CC_PORT="${CREDITCARD_SERVICE_PORT:-8086}"
GATEWAY_P="${GATEWAY_PORT:-8080}"
FRONTEND_P="${FRONTEND_PORT:-5173}"

stop_port() {
    local port=$1
    local name=$2
    local pids=$(lsof -ti :$port 2>/dev/null)
    if [ -n "$pids" ]; then
        echo " Stopping $name on port $port (PID: $pids)..."
        kill -9 $pids 2>/dev/null || true
    else
        echo " $name on port $port is not running."
    fi
}

stop_port "$FRONTEND_P" "financeX-ui"
stop_port "$GATEWAY_P" "financeX-core"
stop_port "$USER_PORT" "user-service"
stop_port "$EXPENSE_PORT" "expense-service"
stop_port "$P2P_PORT" "p2p-service"
stop_port "$CC_PORT" "creditcard-service"

# Also stop cloudflared if running
killall cloudflared 2>/dev/null && echo " Stopped cloudflared." || true

echo "========================================================"
echo " All services stopped cleanly."
echo "========================================================"
