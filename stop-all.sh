#!/bin/bash

echo "========================================================"
echo " Stopping all FinanceApp Services..."
echo "========================================================"

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

stop_port 5173 "financeX-ui"
stop_port 8080 "financeX-core"
stop_port 8081 "user-service"
stop_port 8082 "expense-service"
stop_port 8084 "p2p-service"
stop_port 8086 "creditcard-service"

# Also stop cloudflared if running
killall cloudflared 2>/dev/null && echo " Stopped cloudflared." || true

echo "========================================================"
echo " All services stopped cleanly."
echo "========================================================"

