#!/bin/sh
set -e

echo "===================================================="
echo " Starting FinanceApp Unified Container Services..."
echo "===================================================="

# Trap signals for graceful container shutdown
cleanup() {
    echo "Stopping all microservices..."
    kill $(jobs -p) 2>/dev/null || true
    exit 0
}
trap cleanup SIGINT SIGTERM

# Start microservices in background on internal loopback
echo "--> Starting user-service on port 8081..."
java -Dserver.address=127.0.0.1 -Dserver.port=8081 -jar /app/user-service.jar > /var/log/user-service.log 2>&1 &

echo "--> Starting expense-service on port 8082..."
java -Dserver.address=127.0.0.1 -Dserver.port=8082 -jar /app/expense-service.jar > /var/log/expense-service.log 2>&1 &

echo "--> Starting p2p-service on port 8084..."
java -Dserver.address=127.0.0.1 -Dserver.port=8084 -jar /app/p2p-service.jar > /var/log/p2p-service.log 2>&1 &

echo "--> Starting creditcard-service on port 8086..."
java -Dserver.address=127.0.0.1 -Dserver.port=8086 -jar /app/creditcard-service.jar > /var/log/creditcard-service.log 2>&1 &

echo "--> Starting financeX-core API Gateway on port 8080..."
java -Dserver.address=127.0.0.1 -Dserver.port=8080 -jar /app/financex-core.jar > /var/log/financex-core.log 2>&1 &

# Wait for gateway to become ready
echo "Waiting for API Gateway to initialize..."
sleep 5

echo "--> Starting NGINX on port 80..."
echo "===================================================="
echo " FinanceApp is now LIVE at http://localhost:80"
echo "===================================================="

# Run NGINX in foreground
exec nginx -g 'daemon off;'

