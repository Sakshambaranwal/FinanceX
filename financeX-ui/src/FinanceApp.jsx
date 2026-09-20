import React from 'react';
import { Link, useLocation } from "react-router-dom";
import { 
  Home, 
  TrendingDown, 
  TrendingUp, 
  Users, 
  User, 
  LogIn, 
  UserPlus, 
  CreditCard, 
  Sun, 
  Moon 
} from 'lucide-react';
import { useAppContext } from './AppContext';

export const FinanceXLogo = ({ size = 22, className = '' }) => (
  <svg 
    width={size} 
    height={size} 
    viewBox="0 0 100 100" 
    fill="none" 
    xmlns="http://www.w3.org/2000/svg"
    className={className}
  >
    <defs>
      <linearGradient id="fxGrad1" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor="#3B82F6" />
        <stop offset="100%" stopColor="#1D4ED8" />
      </linearGradient>
      <linearGradient id="fxGrad2" x1="100%" y1="0%" x2="0%" y2="100%">
        <stop offset="0%" stopColor="#6366F1" />
        <stop offset="100%" stopColor="#4338CA" />
      </linearGradient>
      <linearGradient id="fxAccent" x1="0%" y1="50%" x2="100%" y2="50%">
        <stop offset="0%" stopColor="#60A5FA" />
        <stop offset="100%" stopColor="#818CF8" />
      </linearGradient>
    </defs>
    <rect width="100" height="100" rx="26" fill="#0B0F19" />
    <path d="M26 74 L42 50 L30 26 L42 26 L50 40 L58 26 L70 26 L58 50 L74 74 L62 74 L50 56 L38 74 Z" fill="url(#fxGrad1)" />
    <path d="M36 26 L74 74 L64 74 L26 26 Z" fill="url(#fxGrad2)" opacity="0.9" />
    <polygon points="68,26 76,26 76,34 72,30 68,34" fill="url(#fxAccent)" />
  </svg>
);

const FinanceApp = ({ children }) => {
  const location = useLocation();
  const {
    isAuthenticated,
    setShowMobileMenu,
    theme,
    toggleTheme
  } = useAppContext();

  const navItems = [
    { id: 'dashboard', label: 'Dashboard', shortLabel: 'Home', icon: Home, path: '/dashboard' },
    { id: 'expenses', label: 'Expenses', shortLabel: 'Expenses', icon: TrendingDown, path: '/expenses' },
    { id: 'investments', label: 'Investments', shortLabel: 'Invest', icon: TrendingUp, path: '/investments' },
    { id: 'p2p', label: 'P2P', shortLabel: 'P2P', icon: Users, path: '/p2p' },
    { id: 'creditcards', label: 'Credit Cards', shortLabel: 'Cards', icon: CreditCard, path: '/creditcards' },
    { id: 'profile', label: 'Profile', shortLabel: 'Profile', icon: User, path: '/profile' },
  ];

  const authItems = [
    { id: 'dashboard', label: 'Overview', shortLabel: 'Home', icon: Home, path: '/dashboard' },
    { id: 'login', label: 'Login', shortLabel: 'Login', icon: LogIn, path: '/login' },
    { id: 'signup', label: 'Sign Up', shortLabel: 'Sign Up', icon: UserPlus, path: '/signup' },
  ];

  const activeItems = isAuthenticated ? navItems : authItems;

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950 text-gray-900 dark:text-gray-100 transition-colors duration-200">
      {/* Desktop/Tablet Top Navigation */}
      <header className="hidden md:block bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800 sticky top-0 z-40 shadow-xs">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <Link to="/dashboard" className="flex items-center space-x-2.5 group">
              <FinanceXLogo size={32} className="group-hover:scale-105 transition-transform" />
              <span className="text-xl font-extrabold bg-gradient-to-r from-blue-600 via-indigo-600 to-violet-600 dark:from-blue-400 dark:via-indigo-400 dark:to-violet-400 bg-clip-text text-transparent">
                FinanceX
              </span>
            </Link>

            {/* Desktop Nav Items */}
            <nav className="flex space-x-1 lg:space-x-2">
              {activeItems.map(({ id, label, icon: Icon, path }) => {
                const isActive = location.pathname === path;
                return (
                  <Link
                    key={id}
                    to={path}
                    className={`flex items-center space-x-2 px-3.5 py-2 rounded-xl text-sm font-semibold transition-all ${
                      isActive
                        ? 'bg-blue-50 dark:bg-blue-900/40 text-blue-600 dark:text-blue-400 font-bold'
                        : 'text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 hover:text-gray-900 dark:hover:text-white'
                    }`}
                  >
                    <Icon size={18} className={isActive ? 'text-blue-600 dark:text-blue-400' : ''} />
                    <span>{label}</span>
                  </Link>
                );
              })}
            </nav>

            <div className="flex items-center space-x-3">
              {/* Theme Toggle Button */}
              <button
                onClick={toggleTheme}
                className="p-2 rounded-xl text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                title={`Switch to ${theme === 'dark' ? 'light' : 'dark'} mode`}
                aria-label="Toggle theme"
              >
                {theme === 'dark' ? <Sun size={18} className="text-amber-400" /> : <Moon size={18} />}
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Mobile Top Bar */}
      <header className="md:hidden bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800 sticky top-0 z-40 px-4 h-14 flex justify-between items-center shadow-xs">
        <Link to="/dashboard" className="flex items-center space-x-2 group">
          <FinanceXLogo size={28} className="group-hover:scale-105 transition-transform" />
          <span className="text-lg font-extrabold bg-gradient-to-r from-blue-600 via-indigo-600 to-violet-600 dark:from-blue-400 dark:via-indigo-400 dark:to-violet-400 bg-clip-text text-transparent">
            FinanceX
          </span>
        </Link>

        <div className="flex items-center space-x-2">
          {/* Mobile Theme Toggle */}
          <button
            onClick={toggleTheme}
            className="p-1.5 rounded-lg text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
            title={`Switch to ${theme === 'dark' ? 'light' : 'dark'} mode`}
          >
            {theme === 'dark' ? <Sun size={17} className="text-amber-400" /> : <Moon size={17} />}
          </button>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 py-4 sm:py-6 pb-24 md:pb-8">
        {children}
      </main>

      {/* Mobile Bottom Navigation - Mathematically Equal Spacing */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-white/95 dark:bg-gray-900/95 backdrop-blur-md border-t border-gray-200 dark:border-gray-800 z-50 shadow-lg pb-[env(safe-area-inset-bottom,0px)]">
        <div className={`grid ${isAuthenticated ? 'grid-cols-6' : 'grid-cols-3'} w-full items-center`}>
          {activeItems.map(({ id, label, shortLabel, icon: Icon, path }) => {
            const isActive = location.pathname === path;
            return (
              <Link
                key={id}
                to={path}
                className="flex flex-col items-center justify-center py-2 px-0.5 relative group transition-all"
              >
                {/* Active Indicator Bar on Top */}
                {isActive && (
                  <span className="absolute top-0 left-1/2 -translate-x-1/2 w-8 h-1 bg-blue-600 dark:bg-blue-400 rounded-b-full shadow-xs" />
                )}

                <div className={`p-1 rounded-xl transition-transform duration-150 ${
                  isActive 
                    ? 'text-blue-600 dark:text-blue-400 scale-110' 
                    : 'text-gray-400 dark:text-gray-500 group-hover:text-gray-700 dark:group-hover:text-gray-300'
                }`}>
                  <Icon size={20} strokeWidth={isActive ? 2.5 : 2} />
                </div>

                <span className={`text-[10px] tracking-tight font-medium truncate max-w-full px-0.5 ${
                  isActive
                    ? 'text-blue-600 dark:text-blue-400 font-bold'
                    : 'text-gray-500 dark:text-gray-400'
                }`}>
                  {shortLabel || label}
                </span>
              </Link>
            );
          })}
        </div>
      </nav>
    </div>
  );
};

export default FinanceApp;