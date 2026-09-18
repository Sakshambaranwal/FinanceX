# ===================================================
# Stage 1: Build Frontend (React + Vite)
# ===================================================
FROM node:20-alpine AS frontend-builder
WORKDIR /build/ui
COPY financeX-ui/package*.json ./
RUN npm install
COPY financeX-ui/ ./
RUN npm run build

# ===================================================
# Stage 2: Build Spring Boot Microservices
# ===================================================
FROM maven:3.9.9-eclipse-temurin-21-alpine AS backend-builder
WORKDIR /build

# Build user-service
COPY user-service/pom.xml ./user-service/
COPY user-service/src ./user-service/src
RUN mvn -f user-service/pom.xml clean package -DskipTests

# Build expense-service
COPY expense-service/pom.xml ./expense-service/
COPY expense-service/src ./expense-service/src
RUN mvn -f expense-service/pom.xml clean package -DskipTests

# Build p2p-service
COPY p2p-service/pom.xml ./p2p-service/
COPY p2p-service/src ./p2p-service/src
RUN mvn -f p2p-service/pom.xml clean package -DskipTests

# Build creditcard-service
COPY creditcard-service/pom.xml ./creditcard-service/
COPY creditcard-service/src ./creditcard-service/src
RUN mvn -f creditcard-service/pom.xml clean package -DskipTests

# Build financeX-core (Gateway)
COPY financeX-core/pom.xml ./financeX-core/
COPY financeX-core/src ./financeX-core/src
RUN mvn -f financeX-core/pom.xml clean package -DskipTests

# ===================================================
# Stage 3: Unified All-in-One Runtime Container
# ===================================================
FROM eclipse-temurin:21-jre-alpine

# Install NGINX
RUN apk add --no-cache nginx curl

# Set up app directory and logs
WORKDIR /app
RUN mkdir -p /var/log /run/nginx /usr/share/nginx/html

# Copy NGINX configuration
COPY financeX-ui/nginx.conf /etc/nginx/http.d/default.conf

# Copy React build
COPY --from=frontend-builder /build/ui/dist /usr/share/nginx/html

# Copy all compiled JARs
COPY --from=backend-builder /build/user-service/target/*.jar /app/user-service.jar
COPY --from=backend-builder /build/expense-service/target/*.jar /app/expense-service.jar
COPY --from=backend-builder /build/p2p-service/target/*.jar /app/p2p-service.jar
COPY --from=backend-builder /build/creditcard-service/target/*.jar /app/creditcard-service.jar
COPY --from=backend-builder /build/financeX-core/target/*.jar /app/financex-core.jar

# Copy entrypoint script
COPY docker/entrypoint.sh /app/entrypoint.sh
RUN chmod +x /app/entrypoint.sh

# Expose unified web & API port
EXPOSE 80

ENTRYPOINT ["/app/entrypoint.sh"]

