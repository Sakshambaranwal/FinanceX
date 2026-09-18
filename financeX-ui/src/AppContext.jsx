import React, { createContext, useState, useEffect, useContext } from 'react';
import { 
  DEFAULT_EXCHANGE_RATES, 
  fetchLiveExchangeRates, 
  formatCurrency as formatCurrencyUtil,
  convertAmount as convertAmountUtil,
  getCurrencyFromCountry,
  SUPPORTED_CURRENCIES
} from './utils/currencyUtils';
import { API_ENDPOINTS } from './config';

export const AppContext = createContext(null);

export const parseJwt = (token) => {
  try {
    if (!token) return null;
    const base64Url = token.split('.')[1];
    if (!base64Url) return null;
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
    const jsonPayload = decodeURIComponent(
      atob(base64)
        .split('')
        .map(c => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
        .join('')
    );
    return JSON.parse(jsonPayload);
  } catch (e) {
    return null;
  }
};

export const ContextProvider = ({ children }) => {
  const [jwt, setJwt] = useState(() => {
    return typeof window !== 'undefined' ? sessionStorage.getItem('jwt') : null;
  });
  const [username, setUsername] = useState(() => {
    if (typeof window === 'undefined') return '';
    const stored = sessionStorage.getItem('jwt');
    const payload = parseJwt(stored);
    return payload?.sub || '';
  });
  const [isAuthenticated, setIsAuthenticated] = useState(() => {
    return typeof window !== 'undefined' ? !!sessionStorage.getItem('jwt') : false;
  });
  const [currentPage, setCurrentPage] = useState('dashboard');
  const [showMobileMenu, setShowMobileMenu] = useState(false);
  const [showBalance, setShowBalance] = useState(true);
  const [userProfile, setUserProfile] = useState(null);

  // Multi-currency state:
  // homeCurrency: The permanent database currency tied to the user's location/profile.
  // currency: The ephemeral session/instance viewing currency. On reload, always reverts to homeCurrency.
  const [homeCurrency, setHomeCurrency] = useState('USD');
  const [currency, setCurrencyState] = useState('USD');
  const [rates, setRates] = useState(DEFAULT_EXCHANGE_RATES);

  // Fetch live exchange rates on mount
  useEffect(() => {
    const loadRates = async () => {
      const liveRates = await fetchLiveExchangeRates();
      setRates(liveRates);
    };
    loadRates();
  }, []);

  // Load user profile and user's saved location currency when authenticated
  const loadUserProfile = async (token) => {
    const activeToken = token || jwt || sessionStorage.getItem('jwt');
    if (!activeToken) return;

    try {
      const res = await fetch(API_ENDPOINTS.USER, {
        headers: {
          'Authorization': `Bearer ${activeToken}`
        }
      });
      if (res.ok) {
        const data = await res.json();
        setUserProfile(data);
        const userCurr = data.currency || (data.addresses && data.addresses[0]?.country ? getCurrencyFromCountry(data.addresses[0].country) : 'USD');
        const cleanCurr = (userCurr || 'USD').toUpperCase();
        setHomeCurrency(cleanCurr);
        // On load/reload, viewing currency strictly reverts to user location currency
        setCurrencyState(cleanCurr);
      }
    } catch (e) {
      console.warn('Failed to load user profile in context:', e);
    }
  };

  // Sync token and profile on initial mount
  useEffect(() => {
    const storedJwt = sessionStorage.getItem('jwt');
    if (storedJwt) {
      setJwt(storedJwt);
      setIsAuthenticated(true);
      const payload = parseJwt(storedJwt);
      if (payload?.sub) {
        setUsername(payload.sub);
      }
      loadUserProfile(storedJwt);
    }
  }, []);

  const updateJwt = (newJwt) => {
    setJwt(newJwt);
    if (newJwt) {
      sessionStorage.setItem('jwt', newJwt);
      setIsAuthenticated(true);
      const payload = parseJwt(newJwt);
      if (payload?.sub) {
        setUsername(payload.sub);
      }
      loadUserProfile(newJwt);
    } else {
      sessionStorage.removeItem('jwt');
      setIsAuthenticated(false);
      setUsername('');
      setUserProfile(null);
    }
  };

  // Change viewing currency for this session/instance ONLY.
  // Does NOT persist to database or survive page reload.
  const updateCurrency = (newCurrency) => {
    if (!newCurrency) return;
    const cleanCurrency = newCurrency.toUpperCase();
    setCurrencyState(cleanCurrency);
  };

  // Update permanent home currency (called when user saves profile address or changes currency in profile)
  const updateHomeCurrency = (newHomeCurrency) => {
    if (!newHomeCurrency) return;
    const clean = newHomeCurrency.toUpperCase();
    setHomeCurrency(clean);
    setCurrencyState(clean);
  };

  // Formatting helpers available globally:
  // If fromCurrency is provided, converts from that currency to active viewing currency.
  // If fromCurrency is omitted, assumes amount is already in active viewing currency.
  const formatAmount = (amount, fromCurrency = null) => {
    const sourceCurr = fromCurrency || currency;
    return formatCurrencyUtil(amount, currency, rates, sourceCurr);
  };

  // Converts amount between arbitrary currencies
  const convertAmount = (amount, toCurrency = null, fromCurrency = null) => {
    const targetCurr = toCurrency || currency;
    const sourceCurr = fromCurrency || homeCurrency;
    return convertAmountUtil(amount, targetCurr, sourceCurr, rates);
  };

  // Converts an entered amount from active viewing currency into user's home currency for database storage
  const toStorageAmount = (amountInViewingCurrency) => {
    return convertAmountUtil(amountInViewingCurrency, homeCurrency, currency, rates);
  };

  const activeCurrencyMeta = SUPPORTED_CURRENCIES.find(c => c.code === currency) || {
    code: currency,
    symbol: currency + ' ',
    name: currency
  };

  const contextValue = {
    jwt,
    setJwt: updateJwt,
    username,
    userProfile,
    setUserProfile,
    loadUserProfile,
    isAuthenticated,
    setIsAuthenticated,
    currentPage,
    setCurrentPage,
    showMobileMenu,
    setShowMobileMenu,
    showBalance,
    setShowBalance,
    // Currency context
    homeCurrency,
    currency,
    setCurrency: updateCurrency,
    updateHomeCurrency,
    rates,
    formatCurrency: formatAmount,
    toBaseAmount: toStorageAmount, // alias for backwards compatibility
    toStorageAmount,
    convertAmount,
    currencySymbol: activeCurrencyMeta.symbol,
    currencyMeta: activeCurrencyMeta
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