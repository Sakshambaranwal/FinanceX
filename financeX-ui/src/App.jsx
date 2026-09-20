import React from "react";
import { BrowserRouter, Routes, Route, Navigate, useLocation } from "react-router-dom";
import { ContextProvider, useAppContext } from "./AppContext";
import FinanceApp from "./FinanceApp";
import DashboardContent from "./components/DashboardContent";
import Expense from "./components/Expense";
import InvestmentsContent from "./components/InvestmentContent";
import P2PContent from "./components/P2PContent";
import CreditCardContent from "./components/CreditCardContent";
import ProfileContent from "./components/ProfileContent";
import LoginContent from "./components/LoginContent";
import SignupContent from "./components/SignupContent";

// Protected Route Guard: Requires authentication, redirects to /login if logged out.
// Waits for authChecked before deciding — prevents flash-redirect on page reload.
const ProtectedRoute = ({ children }) => {
  const { isAuthenticated, authChecked } = useAppContext();
  const location = useLocation();

  // Still verifying cookie with server — show smooth spinner (no flash or blank screen)
  if (!authChecked) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  return children;
};

// Public Only Route Guard: For /login and /signup
// If user is already authenticated (cookie still valid), redirect to /dashboard
const PublicOnlyRoute = ({ children }) => {
  const { isAuthenticated, authChecked } = useAppContext();

  if (!authChecked) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (isAuthenticated) {
    return <Navigate to="/dashboard" replace />;
  }

  return children;
};

function App() {
  return (
    <ContextProvider>
      <BrowserRouter>
        <FinanceApp>
          <Routes>
            <Route path="/" element={<Navigate to="/dashboard" replace />} />
            <Route path="/dashboard" element={<DashboardContent />} />

            {/* Protected Routes - restricted when logged out, redirects to /login */}
            <Route
              path="/expenses"
              element={
                <ProtectedRoute>
                  <Expense />
                </ProtectedRoute>
              }
            />
            <Route
              path="/investments"
              element={
                <ProtectedRoute>
                  <InvestmentsContent />
                </ProtectedRoute>
              }
            />
            <Route
              path="/p2p"
              element={
                <ProtectedRoute>
                  <P2PContent />
                </ProtectedRoute>
              }
            />
            <Route
              path="/creditcards"
              element={
                <ProtectedRoute>
                  <CreditCardContent />
                </ProtectedRoute>
              }
            />
            <Route
              path="/profile"
              element={
                <ProtectedRoute>
                  <ProfileContent />
                </ProtectedRoute>
              }
            />

            {/* Public-only Auth Routes */}
            <Route
              path="/login"
              element={
                <PublicOnlyRoute>
                  <LoginContent />
                </PublicOnlyRoute>
              }
            />
            <Route
              path="/signup"
              element={
                <PublicOnlyRoute>
                  <SignupContent />
                </PublicOnlyRoute>
              }
            />

            {/* Catch-all fallback */}
            <Route path="*" element={<Navigate to="/dashboard" replace />} />
          </Routes>
        </FinanceApp>
      </BrowserRouter>
    </ContextProvider>
  );
}

export default App;