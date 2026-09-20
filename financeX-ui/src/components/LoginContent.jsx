import React, { useState, useContext, useEffect } from 'react';
import { AppContext } from '../AppContext';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { API_ENDPOINTS } from '../config';
import GoogleSignInButton from './GoogleSignInButton';

const LoginContent = () => {
  const context = useContext(AppContext);
  const { signIn, isAuthenticated } = context;
  const [usernameOrEmail, setUsernameOrEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  const from = location.state?.from?.pathname || '/dashboard';

  useEffect(() => {
    if (isAuthenticated) {
      navigate(from, { replace: true });
    }
  }, [isAuthenticated, navigate, from]);

  const handleLogin = async (e) => {
    if (e) e.preventDefault();
    setError('');

    if (!usernameOrEmail.trim() || !password.trim()) {
      setError('Please enter both username/email and password.');
      return;
    }

    setLoading(true);
    try {
      const basicAuth = btoa(`${usernameOrEmail.trim()}:${password}`);
      const response = await fetch(API_ENDPOINTS.LOGIN, {
        method: 'GET',
        credentials: 'include', // Required so the Set-Cookie from gateway is accepted
        headers: {
          'Authorization': `Basic ${basicAuth}`,
          'Accept': 'application/json, text/plain, */*',
        },
      });

      const contentType = response.headers.get('content-type') || '';
      if (response.ok && !contentType.includes('text/html')) {
        // The gateway has set the HttpOnly JWT cookie on this response.
        // We don't need to read or store the token ourselves.
        signIn(usernameOrEmail.trim());
        navigate(from, { replace: true });
      } else if (contentType.includes('text/html')) {
        setError('Server route error: received HTML instead of auth response. Please refresh and retry.');
      } else {
        const msg = await response.text();
        setError(msg || 'Invalid username/email or password.');
      }
    } catch (err) {
      setError('Unable to connect to login server: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-md mx-auto">
      <div className="bg-white dark:bg-gray-900 p-6 sm:p-8 rounded-2xl border border-gray-200/80 dark:border-gray-800 shadow-sm">
        <h2 className="text-2xl font-bold text-center mb-6 text-gray-900 dark:text-gray-100">Welcome Back</h2>

        {location.state?.from && !error && (
          <div className="mb-4 p-3 bg-blue-50 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-800/60 text-blue-800 dark:text-blue-300 text-xs font-semibold rounded-xl flex items-center space-x-2">
            <span>🔒 Please sign in to access that protected page.</span>
          </div>
        )}

        {error && (
          <div className="mb-4 p-3 bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-300 text-sm rounded-xl">
            {error}
          </div>
        )}

        {/* Google One-Click OAuth Sign-In */}
        <div className="mb-5">
          <GoogleSignInButton mode="login" onError={(err) => setError(err)} />
        </div>

        <div className="relative my-6">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-gray-200 dark:border-gray-800" />
          </div>
          <div className="relative flex justify-center text-xs uppercase">
            <span className="bg-white dark:bg-gray-900 px-3 text-gray-500 dark:text-gray-400 font-medium tracking-wider">
              Or continue with password
            </span>
          </div>
        </div>

        <form onSubmit={handleLogin} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Username or Email
            </label>
            <input
              type="text"
              value={usernameOrEmail}
              onChange={(e) => setUsernameOrEmail(e.target.value)}
              required
              className="w-full px-3.5 py-2.5 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-700 text-gray-900 dark:text-gray-100 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
              placeholder="Enter your username or email"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Password
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              className="w-full px-3.5 py-2.5 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-700 text-gray-900 dark:text-gray-100 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
              placeholder="Enter your password"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white py-3 rounded-xl font-semibold transition-colors disabled:opacity-50 shadow-xs"
          >
            {loading ? 'Signing In...' : 'Sign In'}
          </button>
        </form>

        <p className="text-center mt-6 text-gray-600 dark:text-gray-400 text-sm">
          Don't have an account?{' '}
          <Link to="/signup" className="text-blue-600 dark:text-blue-400 font-semibold hover:underline">
            Sign up
          </Link>
        </p>
      </div>
    </div>
  );
};

export default LoginContent;