import { useState, useContext, useEffect } from 'react';
import { AppContext } from '../AppContext';
import { useNavigate } from 'react-router-dom';

const LoginContent = () => {
  const context = useContext(AppContext);
  const { setJwt, isAuthenticated, setIsAuthenticated } = context;
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    if (isAuthenticated) {
      navigate('/dashboard', { replace: true });
    }
  }, [isAuthenticated, navigate]);

  const handleLogin = async () => {
    try {
      // Create the Basic Auth header
      const basicAuth = btoa(`${email}:${password}`);
      const response = await fetch('http://localhost:8080/login', {
        method: 'GET', // Use POST unless your backend expects GET
        headers: {
          'Authorization': `Basic ${basicAuth}`,
          // Add 'Content-Type' only if your backend expects a body
        },
        // body: JSON.stringify({ username: email, password }), // Only if backend expects it
      });
      if (response.ok) {
        const data = await response.text(); // or response.json() if your backend returns JSON
        setJwt(data); 
        sessionStorage.setItem('jwt', data); // Store JWT in sessionStorage under the key 'jwt'
        setIsAuthenticated(true); // Update authentication state
        navigate('/dashboard');
      } else {
        alert('Login failed');
      }
    } catch (err) {
      alert('Login failed'+ err.message);
    }
  };

  return (
    <div className="max-w-md mx-auto">
      <div className="bg-white p-8 rounded-xl border border-gray-200">
        <h2 className="text-2xl font-bold text-center mb-6">Welcome Back</h2>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Email
            </label>
            <input
              type="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Enter your email"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Password
            </label>
            <input
              type="password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Enter your password"
            />
          </div>
          <button
            onClick={handleLogin}
            className="w-full bg-blue-600 text-white py-3 rounded-lg font-semibold hover:bg-blue-700 transition-colors"
          >
            Sign In
          </button>
        </div>
      </div>
    </div>
  );
};

export default LoginContent;