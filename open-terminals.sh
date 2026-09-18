#!/bin/bash

echo "Opening FinanceApp services in separate Terminal windows..."

os_cmd="set -a && [ -f /Users/saksham/Downloads/FinanceApp/.env ] && source /Users/saksham/Downloads/FinanceApp/.env && set +a"

osascript \
  -e 'tell application "Terminal"' \
  -e 'activate' \
  -e "do script \"$os_cmd && cd /Users/saksham/Downloads/FinanceApp/user-service && echo \\\"=== Starting user-service (Port 8081) ===\\\" && ./mvnw spring-boot:run\"" \
  -e "do script \"$os_cmd && cd /Users/saksham/Downloads/FinanceApp/expense-service && echo \\\"=== Starting expense-service (Port 8082) ===\\\" && ./mvnw spring-boot:run\"" \
  -e "do script \"$os_cmd && cd /Users/saksham/Downloads/FinanceApp/p2p-service && echo \\\"=== Starting p2p-service (Port 8084) ===\\\" && ./mvnw spring-boot:run\"" \
  -e "do script \"$os_cmd && cd /Users/saksham/Downloads/FinanceApp/creditcard-service && echo \\\"=== Starting creditcard-service (Port 8086) ===\\\" && ./mvnw spring-boot:run\"" \
  -e "do script \"$os_cmd && cd /Users/saksham/Downloads/FinanceApp/financeX-core && echo \\\"=== Starting financeX-core Gateway (Port 8080) ===\\\" && ./mvnw spring-boot:run\"" \
  -e "do script \"$os_cmd && cd /Users/saksham/Downloads/FinanceApp/financeX-ui && echo \\\"=== Starting financeX-ui Frontend (Port 5173) ===\\\" && npm run dev\"" \
  -e 'do script "echo \"=== Starting Cloudflare Quick Tunnel (Port 5173) ===\" && cloudflared tunnel --url http://localhost:5173"' \
  -e 'end tell'

echo "========================================================"
echo " All 7 services (including Cloudflare) opened in separate Terminal windows!"
echo " You can view the live console logs and public URL in each window."
echo " To stop everything anytime, run: ./stop-all.sh"
echo "========================================================"

