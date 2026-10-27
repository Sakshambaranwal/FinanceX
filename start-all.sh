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
JAVA_OPTS="${JAVA_OPTS:--XX:+UseSerialGC -XX:ActiveProcessorCount=1}"
read -r -a JAVA_ARGS <<< "$JAVA_OPTS"

SERVICE_JARS=(
    "$DIR/user-service/target/user-service-0.0.1-SNAPSHOT.jar"
    "$DIR/expense-service/target/expense-service-0.0.1-SNAPSHOT.jar"
    "$DIR/p2p-service/target/p2p-service-0.0.1-SNAPSHOT.jar"
    "$DIR/creditcard-service/target/creditcard-service-0.0.1-SNAPSHOT.jar"
    "$DIR/financeX-core/target/financex-core-0.0.1-SNAPSHOT.jar"
)

for jar in "${SERVICE_JARS[@]}"; do
    if [ ! -f "$jar" ]; then
        echo "Missing service JAR: $jar"
        echo "Build the services first with: bash ./build-services.sh"
        exit 1
    fi
done

# Helper function to start a service if not already running
start_service() {
    local name=$1
    local jar=$2
    local port=$3
    local log="$LOG_DIR/$name.log"

    if lsof -iTCP:$port -sTCP:LISTEN > /dev/null 2>&1; then
        echo " [ALREADY RUNNING] $name on port $port"
    else
        echo " [STARTING] $name on port $port..."
        java "${JAVA_ARGS[@]}" -jar "$jar" --server.port="$port" > "$log" 2>&1 &
    fi
}

start_service "user-service" "${SERVICE_JARS[0]}" "$USER_PORT"
start_service "expense-service" "${SERVICE_JARS[1]}" "$EXPENSE_PORT"
start_service "p2p-service" "${SERVICE_JARS[2]}" "$P2P_PORT"
start_service "creditcard-service" "${SERVICE_JARS[3]}" "$CC_PORT"
start_service "financeX-core" "${SERVICE_JARS[4]}" "$GATEWAY_P"

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
