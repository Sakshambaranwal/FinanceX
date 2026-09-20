// Centralized Authenticated API Client for FinanceX
// With HttpOnly cookies, the browser sends the JWT cookie automatically on every request.
// We just need to ensure credentials: 'include' is always set.

export const authFetch = async (url, options = {}) => {
  const headers = new Headers(options.headers || {});

  // Set default JSON Content-Type if body is a string and Content-Type is not provided
  if (options.body && typeof options.body === 'string' && !headers.has('Content-Type')) {
    headers.set('Content-Type', 'application/json');
  }

  const mergedOptions = {
    ...options,
    headers,
    credentials: 'include', // Always send the HttpOnly JWT cookie
  };

  try {
    const response = await fetch(url, mergedOptions);

    if (response.status === 401 && !url.includes('/login') && !url.includes('/register') && !url.includes('/ping')) {
      console.warn(`[authFetch] Unauthorized (401) on ${url}`);
      // Notify application of auth failure without forcing hard page reloads
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('financex:auth_error', { detail: { url, status: 401 } }));
      }
    }

    return response;
  } catch (error) {
    console.error(`Fetch error for ${url}:`, error);
    throw error;
  }
};

export default authFetch;
