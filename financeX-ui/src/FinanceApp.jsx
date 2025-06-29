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
  Menu,
  X,
  DollarSign,
  ArrowUpRight,
  ArrowDownRight,
  Eye,
  EyeOff
} from 'lucide-react';
import { useAppContext } from './AppContext';

const FinanceApp = ({ children }) => {
  const location = useLocation();
  const {
    currentPage,
    setCurrentPage,
    isAuthenticated,
    setIsAuthenticated,
    showMobileMenu,
    setShowMobileMenu,
    showBalance,
    setShowBalance,
  } = useAppContext();

  const navItems = [
    { id: 'dashboard', label: 'Dashboard', icon: Home, path: '/dashboard' },
    { id: 'expenses', label: 'Expenses', icon: TrendingDown, path: '/expenses' },
    { id: 'investments', label: 'Investments', icon: TrendingUp, path: '/investments' },
    { id: 'p2p', label: 'P2P', icon: Users, path: '/p2p' },
    { id: 'profile', label: 'Profile', icon: User, path: '/profile' },
  ];

  const authItems = [
    { id: 'login', label: 'Login', icon: LogIn, path: '/login' },
    { id: 'signup', label: 'Sign Up', icon: UserPlus, path: '/signup' },
  ];

  const Navigation = ({ isMobile = false }) => {
    const items = isAuthenticated ? navItems : authItems;
    return (
      <nav className={`${isMobile ? 'flex justify-around py-2' : 'flex space-x-8'}`}>
        {items.map(({ id, label, icon: Icon, path }) => (
          <Link
            key={id}
            to={path}
            className={`flex items-center ${isMobile ? 'flex-col space-y-1 px-3 py-2' : 'space-x-2 px-4 py-2'} rounded-lg transition-colors ${
              location.pathname === path
                ? 'bg-blue-600 text-white'
                : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
            }`}
            onClick={() => setShowMobileMenu(false)}
          >
            <Icon size={isMobile ? 20 : 18} />
            <span className={`${isMobile ? 'text-xs' : 'text-sm'} font-medium`}>
              {label}
            </span>
          </Link>
        ))}
      </nav>
    );
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Desktop/Tablet Top Navigation */}
      <header className="hidden md:block bg-white border-b border-gray-200 sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-3">
              <DollarSign className="text-blue-600" size={32} />
              <h1 className="text-xl font-bold text-gray-900">FinanceX</h1>
            </div>
            <Navigation />
            {isAuthenticated && (
              <div className="flex items-center space-x-4">
                <button className="p-2 text-gray-600 hover:text-gray-900">
                  <User size={20} />
                </button>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* Mobile Top Bar */}
      <header className="md:hidden bg-white border-b border-gray-200 sticky top-0 z-40">
        <div className="flex justify-between items-center h-16 px-4">
          <div className="flex items-center space-x-3">
            <DollarSign className="text-blue-600" size={28} />
            <h1 className="text-lg font-bold text-gray-900">FinanceX</h1>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 pb-20 md:pb-6">
        {children}
      </main>

      {/* Mobile Bottom Navigation */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 z-40">
        <Navigation isMobile={true} />
      </nav>
    </div>
  );
};

export default FinanceApp;