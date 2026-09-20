import React, { createContext, useState, useEffect, useContext } from 'react';
import { 
  DEFAULT_EXCHANGE_RATES, 
  fetchLiveExchangeRates, 
  formatCurrency as formatCurrencyUtil,
  convertAmount as convertAmountUtil,
  getCurrencyFromCountry,
  SUPPORTED_CURRENCIES,
  detectDefaultCurrency
} from './utils/currencyUtils';
import { API_ENDPOINTS, DEFAULT_CURRENCY } from './config';

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
  // With HttpOnly cookies, the JWT is managed entirely by the browser/server.
  // We only keep a lightweight "authenticated" flag and username in React state.
  // On page load, we verify auth by calling /ping (cookie is sent automatically).
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [username, setUsername] = useState('');
  const [authChecked, setAuthChecked] = useState(false); // true once we've pinged the server
  const [currentPage, setCurrentPage] = useState('dashboard');
  const [showMobileMenu, setShowMobileMenu] = useState(false);
  const [showBalance, setShowBalance] = useState(true);
  const [userProfile, setUserProfile] = useState(null);

  // Theme state: 'light' | 'dark'
  const [theme, setThemeState] = useState(() => {
    if (typeof window !== 'undefined') {
      const stored = localStorage.getItem('financex_theme');
      if (stored === 'dark' || stored === 'light') return stored;
      return window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
    }
    return 'light';
  });

  useEffect(() => {
    if (typeof document !== 'undefined') {
      const root = document.documentElement;
      if (theme === 'dark') {
        root.classList.add('dark');
      } else {
        root.classList.remove('dark');
      }
      localStorage.setItem('financex_theme', theme);
    }
  }, [theme]);

  const toggleTheme = () => {
    setThemeState(prev => (prev === 'dark' ? 'light' : 'dark'));
  };

  const setTheme = (newTheme) => {
    if (newTheme === 'dark' || newTheme === 'light') {
      setThemeState(newTheme);
    }
  };

  // Multi-currency state (defaults to INR for Indian users)
  const initialCurrency = detectDefaultCurrency();
  const [homeCurrency, setHomeCurrency] = useState(initialCurrency);
  const [currency, setCurrencyState] = useState(initialCurrency);
  const [rates, setRates] = useState(DEFAULT_EXCHANGE_RATES);

  // Fetch live exchange rates on mount
  useEffect(() => {
    const loadRates = async () => {
      const liveRates = await fetchLiveExchangeRates();
      setRates(liveRates);
    };
    loadRates();
  }, []);

  // On mount, verify session with server by hitting /user endpoint.
  // The HttpOnly cookie is sent automatically by the browser.
  useEffect(() => {
    const verifySession = async () => {
      try {
        const res = await fetch(API_ENDPOINTS.USER, {
          credentials: 'include', // always send cookies
        });
        if (res.ok) {
          const data = await res.json();
          setUserProfile(data);
          setUsername(data.username || data.sub || '');
          setIsAuthenticated(true);
          const userCurr = data.currency || (data.addresses?.[0]?.country ? getCurrencyFromCountry(data.addresses[0].country) : initialCurrency);
          const cleanCurr = (userCurr || initialCurrency).toUpperCase();
          setHomeCurrency(cleanCurr);
          setCurrencyState(cleanCurr);
        } else {
          // Cookie is absent or expired — user is not logged in
          setIsAuthenticated(false);
        }
      } catch (e) {
        setIsAuthenticated(false);
      } finally {
        setAuthChecked(true);
      }
    };
    verifySession();
  }, []);

  const loadUserProfile = async () => {
    try {
      const res = await fetch(API_ENDPOINTS.USER, { credentials: 'include' });
      if (res.ok) {
        const data = await res.json();
        setUserProfile(data);
        const userCurr = data.currency || (data.addresses?.[0]?.country ? getCurrencyFromCountry(data.addresses[0].country) : initialCurrency);
        const cleanCurr = (userCurr || initialCurrency).toUpperCase();
        setHomeCurrency(cleanCurr);
        setCurrencyState(cleanCurr);
      }
    } catch (e) {
      console.warn('Failed to load user profile in context:', e);
    }
  };

  /**
   * Called after a successful login response.
   * The gateway has already set the HttpOnly cookie on the response.
   * We just update local React state with the username.
   */
  const signIn = (usernameValue) => {
    setUsername(usernameValue || '');
    setIsAuthenticated(true);
    loadUserProfile();
  };

  /**
   * Called on logout. Clears local state.
   * The gateway clears the HttpOnly cookie via Set-Cookie: Max-Age=0.
   */
  const signOut = () => {
    setIsAuthenticated(false);
    setUsername('');
    setUserProfile(null);
    setHomeCurrency(DEFAULT_CURRENCY);
    setCurrencyState(DEFAULT_CURRENCY);
  };

  const updateCurrency = (newCurrency) => {
    if (!newCurrency) return;
    setCurrencyState(newCurrency.toUpperCase());
  };

  const updateHomeCurrency = (newHomeCurrency) => {
    if (!newHomeCurrency) return;
    const clean = newHomeCurrency.toUpperCase();
    setHomeCurrency(clean);
    setCurrencyState(clean);
  };

  const formatAmount = (amount, fromCurrency = null) => {
    const sourceCurr = fromCurrency || currency;
    return formatCurrencyUtil(amount, currency, rates, sourceCurr);
  };

  const convertAmount = (amount, toCurrency = null, fromCurrency = null) => {
    const targetCurr = toCurrency || currency;
    const sourceCurr = fromCurrency || homeCurrency;
    return convertAmountUtil(amount, targetCurr, sourceCurr, rates);
  };

  const toStorageAmount = (amountInViewingCurrency) => {
    return convertAmountUtil(amountInViewingCurrency, homeCurrency, currency, rates);
  };

  const activeCurrencyMeta = SUPPORTED_CURRENCIES.find(c => c.code === currency) || {
    code: currency,
    symbol: currency + ' ',
    name: currency
  };

  const contextValue = {
    // Auth
    isAuthenticated,
    setIsAuthenticated,
    authChecked,
    username,
    setUsername,
    userProfile,
    setUserProfile,
    loadUserProfile,
    signIn,
    signOut,
    // Legacy aliases so other components don't break
    jwt: null,
    setJwt: (token) => {
      // No-op: JWT is managed via HttpOnly cookie now.
      // signIn() should be called explicitly instead.
    },
    // App state
    currentPage,
    setCurrentPage,
    showMobileMenu,
    setShowMobileMenu,
    showBalance,
    setShowBalance,
    // Theme
    theme,
    setTheme,
    toggleTheme,
    // Currency
    homeCurrency,
    currency,
    setCurrency: updateCurrency,
    updateHomeCurrency,
    rates,
    formatCurrency: formatAmount,
    toBaseAmount: toStorageAmount,
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