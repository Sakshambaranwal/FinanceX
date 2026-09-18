import React, { useState, useContext, useEffect } from 'react';
import { AppContext } from '../AppContext';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { API_ENDPOINTS } from '../config';

const LoginContent = () => {
  const context = useContext(AppContext);
  const { setJwt, isAuthenticated, setIsAuthenticated } = context;
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
        headers: {
          'Authorization': `Basic ${basicAuth}`,
        },
      });

      if (response.ok) {
        const data = await response.text();
        setJwt(data);
        sessionStorage.setItem('jwt', data);
        setIsAuthenticated(true);
        navigate(from, { replace: true });
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
      <div className="bg-white p-8 rounded-xl border border-gray-200 shadow-sm">
        <h2 className="text-2xl font-bold text-center mb-6 text-gray-900">Welcome Back</h2>

        {location.state?.from && !error && (
          <div className="mb-4 p-3 bg-blue-50 border border-blue-200 text-blue-800 text-xs font-semibold rounded-lg flex items-center space-x-2">
            <span>🔒 Please sign in to access that protected page.</span>
          </div>
        )}

        {error && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-700 text-sm rounded-lg">
            {error}
          </div>
        )}

        <form onSubmit={handleLogin} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Username or Email
            </label>
            <input
              type="text"
              value={usernameOrEmail}
              onChange={(e) => setUsernameOrEmail(e.target.value)}
              required
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Enter your username or email"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Password
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Enter your password"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-blue-600 text-white py-3 rounded-lg font-semibold hover:bg-blue-700 transition-colors disabled:opacity-50"
          >
            {loading ? 'Signing In...' : 'Sign In'}
          </button>
        </form>

        <p className="text-center mt-6 text-gray-600 text-sm">
          Don't have an account?{' '}
          <Link to="/signup" className="text-blue-600 font-semibold hover:underline">
            Sign up
          </Link>
        </p>
      </div>
    </div>
  );
};

export default LoginContent;