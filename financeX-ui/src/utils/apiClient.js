// Centralized Authenticated API Client for FinanceX
// Automatically attaches JWT Bearer token from sessionStorage to all gateway requests

export const getAuthToken = () => {
  return sessionStorage.getItem('jwt') || '';
};

export const authFetch = async (url, options = {}) => {
  const token = getAuthToken();
  const headers = new Headers(options.headers || {});

  if (token && !headers.has('Authorization')) {
    headers.set('Authorization', `Bearer ${token}`);
  }

  // Set default JSON Content-Type if body is a string and Content-Type is not provided
  if (options.body && typeof options.body === 'string' && !headers.has('Content-Type')) {
    headers.set('Content-Type', 'application/json');
  }

  const mergedOptions = {
    ...options,
    headers,
  };

  try {
    const response = await fetch(url, mergedOptions);

    // If 401 Unauthorized occurs on protected API calls, clear expired token
    if (response.status === 401 && !url.includes('/login') && !url.includes('/register') && !url.includes('/ping')) {
      console.warn('Session expired or unauthorized request. Clearing session token.');
    }

    return response;
  } catch (error) {
    console.error(`Fetch error for ${url}:`, error);
    throw error;
  }
};

export default authFetch;

