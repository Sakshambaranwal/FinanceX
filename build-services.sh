#!/bin/bash
set -e

DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
SERVICES=(user-service expense-service p2p-service creditcard-service financeX-core)

for service in "${SERVICES[@]}"; do
    echo "Building $service..."
    (cd "$DIR/$service" && ./mvnw -q clean package -DskipTests)
done

echo "All service JARs built successfully."