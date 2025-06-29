import {  useState, useContext } from 'react';
import { AppContext } from '../AppContext';



  const SignupContent = () => {
    const context = useContext(AppContext);
    const { setIsAuthenticated, setCurrentPage } = context;
    return (
      <div className="max-w-md mx-auto">
        <div className="bg-white p-8 rounded-xl border border-gray-200">
          <h2 className="text-2xl font-bold text-center mb-6">Create Account</h2>
          
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Full Name
              </label>
              <input
                type="text"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Enter your full name"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Email
              </label>
              <input
                type="email"
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
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Create a password"
              />
            </div>
            
            <button
              onClick={() => setIsAuthenticated(true)}
              className="w-full bg-blue-600 text-white py-3 rounded-lg font-semibold hover:bg-blue-700 transition-colors"
            >
              Create Account
            </button>
          </div>
          
          <p className="text-center mt-4 text-gray-600">
            Already have an account?{' '}
            <button
              onClick={() => setCurrentPage('login')}
              className="text-blue-600 font-semibold"
            >
              Sign in
            </button>
          </p>
        </div>
      </div>
    );
  };

  export default SignupContent;