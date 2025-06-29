import {  React, createContext, useState, useEffect, useContext } from 'react';

export const AppContext = createContext(null);

export const ContextProvider = ({ children }) => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
    const [currentPage, setCurrentPage] = useState('dashboard');
    const [showMobileMenu, setShowMobileMenu] = useState(false);
    const [showBalance, setShowBalance] = useState(true);
    const [jwt, setJwt] = useState(null);
    useEffect(() => {
        if (sessionStorage.getItem('jwt')) {
            setJwt(sessionStorage.getItem('jwt'));
            setIsAuthenticated(true); 
        }
      }, [isAuthenticated]);
  const contextValue = {
    jwt,
    setJwt,
    isAuthenticated,
    setIsAuthenticated,
    currentPage,
    setCurrentPage,
    showMobileMenu,
    setShowMobileMenu,
    showBalance,
    setShowBalance
  };

  return (
    <AppContext.Provider value={contextValue}>
      {children}
    </AppContext.Provider>
  );
};

export const useAppContext = () => {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useAppContext must be used within a ContextProvider');
  }
  return context;
};
export default AppContext;