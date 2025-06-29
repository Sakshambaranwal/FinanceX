import React from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { ContextProvider } from "./AppContext";
import FinanceApp from "./FinanceApp";
import DashboardContent from "./components/DashboardContent";
import Expense from "./components/Expense";
import InvestmentsContent from "./components/InvestmentContent";
import P2PContent from "./components/P2PContent";
import ProfileContent from "./components/ProfileContent";
import LoginContent from "./components/LoginContent";
import SignupContent from "./components/SignupContent";

function App() {
  return (
    <ContextProvider>
      <BrowserRouter>
        <FinanceApp>
          <Routes>
            <Route path="/" element={<Navigate to="/dashboard" />} />
            <Route path="/dashboard" element={<DashboardContent />} />
            <Route path="/expenses" element={<Expense />} />
            <Route path="/investments" element={<InvestmentsContent />} />
            <Route path="/p2p" element={<P2PContent />} />
            <Route path="/profile" element={<ProfileContent />} />
            <Route path="/login" element={<LoginContent />} />
            <Route path="/signup" element={<SignupContent />} />
          </Routes>
        </FinanceApp>
      </BrowserRouter>
    </ContextProvider>
  );
}

export default App;