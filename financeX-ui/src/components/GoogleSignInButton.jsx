import React, { useEffect, useRef, useState, useContext } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { AppContext, parseJwt } from '../AppContext';
import { API_ENDPOINTS, GOOGLE_CLIENT_ID } from '../config';
import { Loader2 } from 'lucide-react';

const GoogleSignInButton = ({ mode = 'login', onError }) => {
  const { signIn, theme } = useContext(AppContext);
  const navigate = useNavigate();
  const location = useLocation();
  const from = location.state?.from?.pathname || '/dashboard';

  const buttonRef = useRef(null);
  const [loading, setLoading] = useState(false);
  const [scriptReady, setScriptReady] = useState(false);
  const [authError, setAuthError] = useState('');

  const handleCredentialResponse = async (response) => {
    if (!response || !response.credential) {
      const err = 'Failed to receive credential from Google';
      setAuthError(err);
      if (onError) onError(err);
      return;
    }

    setLoading(true);
    setAuthError('');
    try {
      const res = await fetch(API_ENDPOINTS.AUTH_GOOGLE, {
        method: 'POST',
        credentials: 'include', // Required so the Set-Cookie from gateway is stored in the browser
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json, text/plain, */*',
        },
        body: JSON.stringify({ idToken: response.credential }),
      });

      if (res.ok) {
        // Decode Google token to get user's email/name for local context state
        const payload = parseJwt(response.credential);
        const userIdentifier = payload?.email || payload?.name || 'User';
        signIn(userIdentifier);
        navigate(from, { replace: true });
      } else {
        const errText = await res.text();
        const msg = errText || 'Google authentication failed';
        setAuthError(msg);
        if (onError) onError(msg);
      }
    } catch (err) {
      const msg = 'Network error during Google sign-in: ' + err.message;
      setAuthError(msg);
      if (onError) onError(msg);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    let timer;
    const checkGsi = () => {
      if (window.google?.accounts?.id) {
        setScriptReady(true);
      } else {
        timer = setTimeout(checkGsi, 250);
      }
    };
    checkGsi();
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    if (!scriptReady || !buttonRef.current || !window.google?.accounts?.id) return;

    try {
      window.google.accounts.id.initialize({
        client_id: GOOGLE_CLIENT_ID,
        callback: handleCredentialResponse,
        auto_select: false,
      });

      buttonRef.current.innerHTML = '';

      const containerWidth = buttonRef.current.offsetWidth || 340;
      const targetWidth = Math.min(400, Math.max(240, containerWidth));

      window.google.accounts.id.renderButton(buttonRef.current, {
        theme: theme === 'dark' ? 'filled_black' : 'outline',
        size: 'large',
        text: mode === 'signup' ? 'signup_with' : 'signin_with',
        shape: 'rectangular',
        logo_alignment: 'left',
        width: targetWidth,
      });
    } catch (err) {
      console.error('Error initializing Google Sign-In:', err);
    }
  }, [scriptReady, theme, mode]);

  return (
    <div className="w-full flex flex-col items-center">
      {authError && (
        <div className="w-full mb-3 p-3 bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900 text-red-700 dark:text-red-300 text-xs rounded-xl text-center font-medium">
          {authError}
        </div>
      )}

      {loading ? (
        <div className="w-full h-11 flex items-center justify-center bg-gray-100 dark:bg-gray-800 rounded-xl text-sm font-medium text-gray-600 dark:text-gray-300 border border-gray-200 dark:border-gray-700">
          <Loader2 className="animate-spin w-4 h-4 mr-2 text-blue-600 dark:text-blue-400" />
          <span>Authenticating with Google...</span>
        </div>
      ) : (
        <div className="w-full flex justify-center">
          <div ref={buttonRef} className="min-h-[44px] w-full flex justify-center" />
        </div>
      )}
    </div>
  );
};

export default GoogleSignInButton;

