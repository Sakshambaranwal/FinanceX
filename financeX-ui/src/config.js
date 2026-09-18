// Central Configuration for FinanceX UI APIs & Services
// All frontend traffic routes through the financeX-core API Gateway on Port 8080

export const GATEWAY_URL =
  import.meta.env.VITE_GATEWAY_URL !== undefined
    ? import.meta.env.VITE_GATEWAY_URL
    : '';

export const API_BASE_URLS = {
  GATEWAY: GATEWAY_URL,
  USER_SERVICE: GATEWAY_URL,
  EXPENSE_SERVICE: GATEWAY_URL,
  P2P_SERVICE: GATEWAY_URL,
  CREDIT_CARD_SERVICE: GATEWAY_URL,
};

export const API_ENDPOINTS = {
  // User Routes (via Gateway :8080 -> user-service :8081)
  LOGIN: `${API_BASE_URLS.GATEWAY}/login`,
  REGISTER: `${API_BASE_URLS.GATEWAY}/register`,
  USER: `${API_BASE_URLS.GATEWAY}/user`,
  PING: `${API_BASE_URLS.GATEWAY}/ping`,

  // Expense & Investment Routes (via Gateway :8080 -> expense-service :8082)
  EXPENSE: `${API_BASE_URLS.GATEWAY}/expense`,
  EXPENSE_USER: (username) => `${API_BASE_URLS.GATEWAY}/expense/user/${encodeURIComponent(username)}`,
  EXPENSE_BY_ID: (id) => `${API_BASE_URLS.GATEWAY}/expense/${id}`,

  INVESTMENT: `${API_BASE_URLS.GATEWAY}/investment`,
  INVESTMENT_USER: (username) => `${API_BASE_URLS.GATEWAY}/investment/user/${encodeURIComponent(username)}`,
  INVESTMENT_BY_ID: (id) => `${API_BASE_URLS.GATEWAY}/investment/${id}`,

  // P2P Routes (via Gateway :8080 -> p2p-service :8084)
  P2P_SUMMARY: (username) => `${API_BASE_URLS.GATEWAY}/p2p/summary/user/${encodeURIComponent(username)}`,
  P2P_CONTACTS: `${API_BASE_URLS.GATEWAY}/p2p/contacts`,
  P2P_CONTACTS_USER: (username) => `${API_BASE_URLS.GATEWAY}/p2p/contacts/user/${encodeURIComponent(username)}`,
  P2P_CONTACT_BY_ID: (id) => `${API_BASE_URLS.GATEWAY}/p2p/contacts/${id}`,
  P2P_TRANSACTIONS: `${API_BASE_URLS.GATEWAY}/p2p/transactions`,
  P2P_TRANSACTIONS_CONTACT: (contactId) => `${API_BASE_URLS.GATEWAY}/p2p/transactions/contact/${contactId}`,
  P2P_TRANSACTION_BY_ID: (txId) => `${API_BASE_URLS.GATEWAY}/p2p/transactions/${txId}`,
  P2P_SETTLE: (contactId) => `${API_BASE_URLS.GATEWAY}/p2p/settle/${contactId}`,

  // Credit Card Routes (via Gateway :8080 -> creditcard-service :8086)
  CREDIT_CARD_SUMMARY: (username) => `${API_BASE_URLS.GATEWAY}/creditcard/summary/user/${encodeURIComponent(username)}`,
  CREDIT_CARD_SPENDS_USER: (username) => `${API_BASE_URLS.GATEWAY}/creditcard/spends/user/${encodeURIComponent(username)}`,
  CREDIT_CARD_CARDS: `${API_BASE_URLS.GATEWAY}/creditcard/cards`,
  CREDIT_CARD_BY_ID: (id) => `${API_BASE_URLS.GATEWAY}/creditcard/cards/${id}`,
  CREDIT_CARD_SPENDS: `${API_BASE_URLS.GATEWAY}/creditcard/spends`,
  CREDIT_CARD_SPEND_BY_ID: (id) => `${API_BASE_URLS.GATEWAY}/creditcard/spends/${id}`,
  CREDIT_CARD_RECOMMEND: (username, amount, merchant) =>
    `${API_BASE_URLS.GATEWAY}/creditcard/recommend?username=${encodeURIComponent(username)}&amount=${amount}&merchant=${encodeURIComponent(merchant)}`,
  CREDIT_CARD_CATALOG: `${API_BASE_URLS.GATEWAY}/creditcard/catalog`,
};

export default {
  API_BASE_URLS,
  API_ENDPOINTS,
};
