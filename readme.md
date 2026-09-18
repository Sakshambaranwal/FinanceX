# 💸 FinanceX

**FinanceX** is a modern, full-stack Personal Finance Tracking, Rewards Optimization, and Expense Analysis platform built on a scalable microservices architecture.

---

## 🏛️ System Architecture

All client and frontend traffic routes through the **`financeX-core` API Gateway & Security Microservice** on a single unified port (**8080**), which performs centralized CORS validation, JWT bearer token verification, and reverse-proxy routing to downstream internal microservices.

```
┌─────────────────────────┐
│       financeX-ui       │ (Vite Dev Server: 5173)
└────────────┬────────────┘
             │ Single Port (8080)
             ▼
┌─────────────────────────┐
│      financeX-core      │ (API Gateway & Security Guard: 8080)
│  - Centralized CORS     │
│  - JWT Bearer Auth      │
│  - Reverse-Proxy Router │
└────────────┬────────────┘
             │
 ┌───────────┼───────────┬───────────┐
 ▼           ▼           ▼           ▼
user-service expense-srv p2p-service creditcard-srv
 (Port 8081)  (Port 8082) (Port 8084)  (Port 8086)
```

### Microservices Port Map

| Service | Port | Path Prefix | Description |
|---|---|---|---|
| **`financeX-core`** | **`8080`** | `/**` | **API Gateway & Central Security Guard** (Single entry point) |
| **`user-service`** | `8081` | `/login`, `/register`, `/user/**` | User authentication, JWT issuance, profile management |
| **`expense-service`** | `8082` | `/expense/**`, `/investment/**` | Income/expenses, recurring transactions, investment portfolios |
| **`p2p-service`** | `8084` | `/p2p/**` | Khatabook ledger, contacts, borrow/lend settlements |
| **`creditcard-service`**| `8086` | `/creditcard/**` | Card manager, spend tracking, reward caps & advisor |
| **`financeX-ui`** | `5173` | UI | Single-page React application |

---

## 🔐 Centralized API Security

- **Public Endpoints**: `/login`, `/register`, `/ping`, `/public/**`, `/swagger/**`, and CORS `OPTIONS` preflight requests bypass token checks.
- **Protected Endpoints**: All requests to `/user/**`, `/expense/**`, `/investment/**`, `/p2p/**`, `/creditcard/**` strictly require `Authorization: Bearer <token>`.
- Any unauthenticated access receives an immediate **`401 Unauthorized`** response from the Gateway before reaching internal services.

---

## 🚀 Getting Started

### 1. Database
Ensure PostgreSQL is running locally on port `5432` with database `saksham`.

### 2. Start Backend Services
In separate terminal tabs or processes:
```bash
# 1. Start User Service (Port 8081)
cd user-service && ./mvnw spring-boot:run

# 2. Start Expense Service (Port 8082)
cd expense-service && ./mvnw spring-boot:run

# 3. Start P2P Service (Port 8084)
cd p2p-service && ./mvnw spring-boot:run

# 4. Start Credit Card Service (Port 8086)
cd creditcard-service && ./mvnw spring-boot:run

# 5. Start API Gateway (Port 8080)
cd financeX-core && ./mvnw spring-boot:run
```

### 3. Start Frontend UI
```bash
cd financeX-ui
npm install
npm run dev
```
Open `http://localhost:5173` in your browser.
