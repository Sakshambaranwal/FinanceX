#!/bin/bash
set -e

DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
LOG_DIR="$DIR/logs"
mkdir -p "$LOG_DIR"

# Load environment variables from .env if present
if [ -f "$DIR/.env" ]; then
    echo " Loading centralized configuration from .env..."
    set -a
    source "$DIR/.env"
    set +a
fi

echo "========================================================"
echo " Starting FinanceApp Services..."
echo "========================================================"

# Helper function to start a service if not already running
start_service() {
    local name=$1
    local dir=$2
    local port=$3
    local log="$LOG_DIR/$name.log"

    if lsof -i :$port > /dev/null 2>&1; then
        echo " [ALREADY RUNNING] $name on port $port"
    else
        echo " [STARTING] $name on port $port..."
        (cd "$DIR/$dir" && ./mvnw spring-boot:run > "$log" 2>&1) &
    fi
}

start_service "user-service" "user-service" 8081
start_service "expense-service" "expense-service" 8082
start_service "p2p-service" "p2p-service" 8084
start_service "creditcard-service" "creditcard-service" 8086
start_service "financeX-core" "financeX-core" 8080

# Start Frontend
if lsof -i :5173 > /dev/null 2>&1; then
    echo " [ALREADY RUNNING] financeX-ui on port 5173"
else
    echo " [STARTING] financeX-ui on port 5173..."
    (cd "$DIR/financeX-ui" && npm run dev > "$LOG_DIR/financeX-ui.log" 2>&1) &
fi

echo "========================================================"
echo " All services launched! Check status with: ./status.sh"
echo " Stop all services anytime with:         ./stop-all.sh"
echo " Access frontend at:                     http://localhost:5173"
echo "========================================================"

