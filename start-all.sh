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

USER_PORT="${USER_SERVICE_PORT:-8081}"
EXPENSE_PORT="${EXPENSE_SERVICE_PORT:-8082}"
P2P_PORT="${P2P_SERVICE_PORT:-8084}"
CC_PORT="${CREDITCARD_SERVICE_PORT:-8086}"
GATEWAY_P="${GATEWAY_PORT:-8080}"
FRONTEND_P="${FRONTEND_PORT:-5173}"

# Helper function to start a service if not already running
start_service() {
    local name=$1
    local dir=$2
    local port=$3
    local log="$LOG_DIR/$name.log"

    if lsof -iTCP:$port -sTCP:LISTEN > /dev/null 2>&1; then
        echo " [ALREADY RUNNING] $name on port $port"
    else
        echo " [STARTING] $name on port $port..."
        (cd "$DIR/$dir" && ./mvnw spring-boot:run > "$log" 2>&1) &
    fi
}

start_service "user-service" "user-service" "$USER_PORT"
start_service "expense-service" "expense-service" "$EXPENSE_PORT"
start_service "p2p-service" "p2p-service" "$P2P_PORT"
start_service "creditcard-service" "creditcard-service" "$CC_PORT"
start_service "financeX-core" "financeX-core" "$GATEWAY_P"

# Start Frontend
if lsof -iTCP:$FRONTEND_P -sTCP:LISTEN > /dev/null 2>&1; then
    echo " [ALREADY RUNNING] financeX-ui on port $FRONTEND_P"
else
    echo " [STARTING] financeX-ui on port $FRONTEND_P..."
    (cd "$DIR/financeX-ui" && npm run dev > "$LOG_DIR/financeX-ui.log" 2>&1) &
fi

echo "========================================================"
echo " All services launched! Check status with: ./status.sh"
echo " Stop all services anytime with:         ./stop-all.sh"
echo " Access frontend at:                     http://localhost:$FRONTEND_P"
echo "========================================================"
