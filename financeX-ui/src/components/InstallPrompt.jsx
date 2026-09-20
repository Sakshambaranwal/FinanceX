import React, { useState, useEffect } from 'react';
import { Download, X, Smartphone } from 'lucide-react';

const InstallPrompt = () => {
  const [deferredPrompt, setDeferredPrompt] = useState(null);
  const [showPrompt, setShowPrompt] = useState(false);
  const [isInstalled, setIsInstalled] = useState(false);

  useEffect(() => {
    // 1. Check if already running in standalone PWA mode
    const isStandalone =
      window.matchMedia('(display-mode: standalone)').matches ||
      window.navigator.standalone === true;

    if (isStandalone) {
      setIsInstalled(true);
      return;
    }

    // 2. Check if user dismissed it in this session
    const isDismissed = sessionStorage.getItem('financex_pwa_dismissed') === 'true';

    // 3. Listen for Chrome / Edge beforeinstallprompt
    const handleBeforeInstallPrompt = (e) => {
      // Prevent browser's default prompt
      e.preventDefault();
      setDeferredPrompt(e);
      if (!isDismissed) {
        setShowPrompt(true);
      }
    };

    // 4. Listen for successful install
    const handleAppInstalled = () => {
      setIsInstalled(true);
      setShowPrompt(false);
      setDeferredPrompt(null);
    };

    // 5. Allow custom trigger from anywhere in the app
    const handleCustomTrigger = () => {
      setShowPrompt(true);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    window.addEventListener('appinstalled', handleAppInstalled);
    window.addEventListener('financex:show-install-prompt', handleCustomTrigger);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      window.removeEventListener('appinstalled', handleAppInstalled);
      window.removeEventListener('financex:show-install-prompt', handleCustomTrigger);
    };
  }, []);

  const handleInstallClick = async () => {
    if (!deferredPrompt) {
      // Fallback instruction for browsers like Safari (iOS / macOS) where beforeinstallprompt isn't supported
      alert('To install FinanceX:\n- On iPhone/iPad (Safari): Tap Share > Add to Home Screen\n- On Mac (Safari/Chrome): Click File > Add to Dock or click the Install icon in the address bar.');
      setShowPrompt(false);
      return;
    }

    // Trigger native browser install dialog
    deferredPrompt.prompt();
    const choiceResult = await deferredPrompt.userChoice;
    if (choiceResult.outcome === 'accepted') {
      setIsInstalled(true);
    }
    setDeferredPrompt(null);
    setShowPrompt(false);
  };

  const handleDismiss = () => {
    sessionStorage.setItem('financex_pwa_dismissed', 'true');
    setShowPrompt(false);
  };

  if (isInstalled || !showPrompt) {
    return null;
  }

  return (
    <div className="fixed bottom-5 left-4 right-4 sm:left-auto sm:right-6 sm:max-w-md z-50 animate-in fade-in slide-in-from-bottom-5 duration-300">
      <div className="bg-white/95 dark:bg-gray-900/95 backdrop-blur-md rounded-2xl p-4 shadow-2xl border border-gray-200/80 dark:border-gray-800/80">
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-blue-600/10 dark:bg-blue-500/20 text-blue-600 dark:text-blue-400 rounded-xl flex-shrink-0">
              <Smartphone size={22} />
            </div>
            <div>
              <h4 className="text-sm font-bold text-gray-900 dark:text-gray-100 flex items-center gap-1.5">
                Install FinanceX App
              </h4>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5 leading-relaxed">
                Add FinanceX to your home screen or desktop for fast, offline-ready access and native experience.
              </p>
            </div>
          </div>
          <button
            onClick={handleDismiss}
            aria-label="Close"
            className="p-1 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 transition-colors flex-shrink-0"
          >
            <X size={16} />
          </button>
        </div>

        <div className="flex items-center justify-end gap-2.5 mt-3.5 pt-2 border-t border-gray-100 dark:border-gray-800/80">
          <button
            onClick={handleDismiss}
            className="px-3 py-1.5 text-xs font-semibold text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors"
          >
            Later
          </button>
          <button
            onClick={handleInstallClick}
            className="flex items-center gap-1.5 px-4 py-1.5 bg-blue-600 hover:bg-blue-700 active:scale-95 text-white rounded-lg text-xs font-semibold shadow-xs transition-all"
          >
            <Download size={14} />
            <span>Install App</span>
          </button>
        </div>
      </div>
    </div>
  );
};

export default InstallPrompt;

