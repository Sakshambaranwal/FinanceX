import React, { useState, useContext, useEffect } from 'react';
import { AppContext } from '../AppContext';
import { useNavigate, Link } from 'react-router-dom';
import { MapPin, Sparkles, Globe, DollarSign } from 'lucide-react';
import { 
  fetchUserLocation, 
  getCurrencyFromCountry, 
  getAvailableCurrencies,
  detectDefaultCurrency,
  SUPPORTED_CURRENCIES 
} from '../utils/currencyUtils';
import { API_ENDPOINTS } from '../config';
import GoogleSignInButton from './GoogleSignInButton';

const SignupContent = () => {
  const context = useContext(AppContext);
  const { signIn, isAuthenticated, setCurrency } = context;
  const navigate = useNavigate();

  const [username, setUsername] = useState('');
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  
  // Location & Currency states
  const [city, setCity] = useState('');
  const [country, setCountry] = useState('');
  const [selectedCurrency, setSelectedCurrency] = useState(detectDefaultCurrency);
  const [detectingLocation, setDetectingLocation] = useState(true);
  const [locationDetected, setLocationDetected] = useState(false);
  const [locationSource, setLocationSource] = useState('');

  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (isAuthenticated) {
      navigate('/dashboard', { replace: true });
    }
  }, [isAuthenticated, navigate]);

  // Auto-detect Country and City on mount
  useEffect(() => {
    const detectLocation = async () => {
      try {
        setDetectingLocation(true);
        const loc = await fetchUserLocation();
        if (loc) {
          if (loc.city) setCity(loc.city);
          if (loc.country) {
            setCountry(loc.country);
            const derivedCurr = loc.currency || getCurrencyFromCountry(loc.country);
            setSelectedCurrency(derivedCurr);
          }
          setLocationDetected(true);
          setLocationSource(loc.source);
        }
      } catch (err) {
        console.warn('Could not auto-detect location:', err);
      } finally {
        setDetectingLocation(false);
      }
    };

    detectLocation();
  }, []);

  // When Country changes, automatically update the default currency for that country
  const handleCountryChange = (newCountry) => {
    setCountry(newCountry);
    const autoCurr = getCurrencyFromCountry(newCountry);
    setSelectedCurrency(autoCurr);
  };

  const handleSignup = async (e) => {
    e.preventDefault();
    setError('');

    if (!username.trim() || !password.trim()) {
      setError('Username and password are required');
      return;
    }

    setLoading(true);
    try {
      const nameParts = fullName.trim().split(' ');
      const firstname = nameParts[0] || '';
      const lastname = nameParts.slice(1).join(' ') || '';

      const addresses = (city.trim() || country.trim()) ? [{
        city: city.trim(),
        country: country.trim()
      }] : [];

      const response = await fetch(API_ENDPOINTS.REGISTER, {
        method: 'POST',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          username: username.trim(),
          email: email.trim() || null,
          password: password,
          firstname,
          lastname,
          currency: selectedCurrency,
          addresses
        }),
      });

      if (response.ok) {
        signIn(username.trim());
        if (setCurrency) {
          setCurrency(selectedCurrency);
        }
        navigate('/dashboard');
      } else {
        const errorMsg = await response.text();
        setError(errorMsg || 'Registration failed. Please try again.');
      }
    } catch (err) {
      setError('Could not connect to server: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-lg mx-auto">
      <div className="bg-white dark:bg-gray-900 p-8 rounded-2xl border border-gray-200 dark:border-gray-800 shadow-sm transition-colors">
        <h2 className="text-2xl font-bold text-center mb-1 text-gray-900 dark:text-gray-100">Create Account</h2>
        <p className="text-sm text-gray-500 dark:text-gray-400 text-center mb-6">Join FinanceX to manage expenses, investments & P2P Khatabook</p>

        {error && (
          <div className="mb-4 p-3 bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900 text-red-700 dark:text-red-400 text-sm rounded-lg">
            {error}
          </div>
        )}

        {/* Location Detection Notification */}
        {detectingLocation ? (
          <div className="mb-4 p-3 bg-blue-50 dark:bg-blue-950/40 border border-blue-100 dark:border-blue-900/60 rounded-xl flex items-center space-x-2 text-xs text-blue-700 dark:text-blue-300 animate-pulse">
            <MapPin size={16} className="text-blue-500 animate-bounce" />
            <span>Auto-detecting your country and city from IP location...</span>
          </div>
        ) : locationDetected && (
          <div className="mb-4 p-3 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-100 dark:border-emerald-900/60 rounded-xl flex items-center justify-between text-xs text-emerald-800 dark:text-emerald-300">
            <div className="flex items-center space-x-2">
              <MapPin size={16} className="text-emerald-600 dark:text-emerald-400 flex-shrink-0" />
              <span>
                Location detected: <strong>{city ? `${city}, ` : ''}{country}</strong>
              </span>
            </div>
            <span className="bg-emerald-100 dark:bg-emerald-900/70 px-2 py-0.5 rounded font-semibold text-[11px] text-emerald-800 dark:text-emerald-200 flex items-center gap-1">
              <Sparkles size={11} /> Currency: {selectedCurrency}
            </span>
          </div>
        )}

        {/* Google One-Click OAuth Sign-Up */}
        <div className="mb-5">
          <GoogleSignInButton mode="signup" onError={(err) => setError(err)} />
        </div>

        <div className="relative my-6">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-gray-200 dark:border-gray-800" />
          </div>
          <div className="relative flex justify-center text-xs uppercase">
            <span className="bg-white dark:bg-gray-900 px-3 text-gray-500 dark:text-gray-400 font-medium tracking-wider">
              Or register manually
            </span>
          </div>
        </div>

        <form onSubmit={handleSignup} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Username <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              required
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
              placeholder="Choose a username"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Full Name
            </label>
            <input
              type="text"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
              placeholder="e.g. John Doe"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Email
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
              placeholder="Enter your email"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Password <span className="text-red-500">*</span>
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
              placeholder="Create a password"
            />
          </div>

          {/* Location & Address Auto-detected Fields */}
          <div className="pt-2 border-t border-gray-100 dark:border-gray-800">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-bold text-gray-700 dark:text-gray-300 uppercase tracking-wider flex items-center gap-1.5">
                <Globe size={14} className="text-blue-600 dark:text-blue-400" /> Location & Currency
              </span>
              <span className="text-[11px] text-gray-400 dark:text-gray-500">Auto-detected / Editable</span>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">City</label>
                <input
                  type="text"
                  value={city}
                  onChange={(e) => setCity(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
                  placeholder="e.g. Mumbai, New York"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">Country</label>
                <input
                  type="text"
                  value={country}
                  onChange={(e) => handleCountryChange(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
                  placeholder="e.g. India, United States"
                />
              </div>
            </div>

            <div className="mt-3">
              <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">
                Default Currency <span className="text-gray-400 dark:text-gray-500 font-normal">(based on country)</span>
              </label>
              <select
                value={selectedCurrency}
                onChange={(e) => setSelectedCurrency(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
              >
                {getAvailableCurrencies(selectedCurrency).map((c) => (
                  <option key={c.code} value={c.code}>
                    {c.code} ({c.symbol}) - {c.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white py-3 rounded-lg font-semibold transition-colors disabled:opacity-50 mt-2 shadow-sm"
          >
            {loading ? 'Creating Account...' : 'Create Account'}
          </button>
        </form>

        <p className="text-center mt-6 text-gray-600 dark:text-gray-400 text-sm">
          Already have an account?{' '}
          <Link to="/login" className="text-blue-600 dark:text-blue-400 font-semibold hover:underline">
            Sign in
          </Link>
        </p>
      </div>
    </div>
  );
};

export default SignupContent;