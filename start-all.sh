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

if ! command -v nginx > /dev/null 2>&1; then
    echo "NGINX is not installed. Install it with: sudo apt install nginx"
    exit 1
fi

if [ ! -f "$DIR/financeX-ui/dist/index.html" ]; then
    echo "Missing frontend build: $DIR/financeX-ui/dist/index.html"
    echo "Deploy the built financeX-ui/dist directory before starting FinanceX."
    exit 1
fi

sudo install -d -m 755 /var/www/financex /etc/nginx/sites-available /etc/nginx/sites-enabled
sudo rsync -a --delete "$DIR/financeX-ui/dist/" /var/www/financex/
sudo install -m 644 "$DIR/financeX-ui/nginx.conf" /etc/nginx/sites-available/financex
sudo ln -sfn /etc/nginx/sites-available/financex /etc/nginx/sites-enabled/financex
sudo rm -f /etc/nginx/sites-enabled/default
sudo nginx -t

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

sudo systemctl enable nginx
if sudo systemctl is-active --quiet nginx; then
    sudo systemctl reload nginx
else
    sudo systemctl start nginx
fi

echo "========================================================"
echo " All services launched! Check status with: ./status.sh"
echo " Stop all services anytime with:         ./stop-all.sh"
echo " Access frontend at:                     http://localhost/"
echo "========================================================"
