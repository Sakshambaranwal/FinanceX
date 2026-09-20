import React, { useState, useEffect, useContext } from 'react';
import { 
  User, 
  Mail, 
  Phone, 
  Shield, 
  Calendar, 
  Edit3, 
  Check, 
  X, 
  Sparkles, 
  LogOut,
  AlertCircle,
  CheckCircle2,
  Lock,
  MapPin,
  Globe,
  Sun,
  Moon,
  QrCode,
  Copy
} from 'lucide-react';
import { AppContext } from '../AppContext';
import { useNavigate } from 'react-router-dom';
import { 
  SUPPORTED_CURRENCIES, 
  getCurrencyFromCountry,
  getAvailableCurrencies
} from '../utils/currencyUtils';
import { API_ENDPOINTS } from '../config';
import { authFetch } from '../utils/apiClient';

const ProfileContent = () => {
  const { setCurrency, updateHomeCurrency, homeCurrency, currency, signOut, theme, setTheme } = useContext(AppContext);
  const navigate = useNavigate();

  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  // Single Edit Mode state
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({
    firstname: '',
    lastname: '',
    email: '',
    phone: '',
    city: '',
    country: ''
  });
  const [saving, setSaving] = useState(false);

  // Verification modal state
  const [verifyModal, setVerifyModal] = useState({
    open: false,
    type: null,
    step: 'send', // 'send' | 'enter'
    otp: '',
    sendingOtp: false,
    error: '',
    successInfo: ''
  });
  const [verifying, setVerifying] = useState(false);

  // Security / Password modal
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [passwordError, setPasswordError] = useState('');
  const [passwordSuccess, setPasswordSuccess] = useState('');
  const [changingPassword, setChangingPassword] = useState(false);

  // Direct UPI inline edit state
  const [isEditingUpiDirect, setIsEditingUpiDirect] = useState(false);
  const [upiDirectInput, setUpiDirectInput] = useState('');

  const isGoogleUser = Boolean(user?.authProvider && user.authProvider.toUpperCase().includes('GOOGLE'));

  const fetchUserProfile = async () => {
    try {
      setLoading(true);
      setError('');
      const response = await authFetch(API_ENDPOINTS.USER);

      if (response.ok) {
        const data = await response.json();
        setUser(data);
        const addr = (data.addresses && data.addresses.length > 0) ? data.addresses[0] : {};
        const userCurr = data.currency || 'USD';
        
        setFormData({
          firstname: data.firstname || '',
          lastname: data.lastname || '',
          email: data.email || '',
          phone: data.phone || '',
          city: addr.city || '',
          country: addr.country || ''
        });

        if (updateHomeCurrency) {
          updateHomeCurrency(userCurr);
        } else if (setCurrency) {
          setCurrency(userCurr);
        }
      } else if (response.status === 401) {
        navigate('/login');
      } else {
        setError('Failed to fetch profile details.');
      }
    } catch (err) {
      setError('Cannot connect to user service: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUserProfile();
  }, []);

  const handleLogout = async () => {
    try {
      await fetch('/user/logout', { method: 'POST', credentials: 'include' });
    } catch (e) {
      // Best effort
    }
    signOut();
    navigate('/login');
  };

  const handleCountryChange = (countryName) => {
    setFormData(prev => ({
      ...prev,
      country: countryName
    }));
  };

  const handleUpdateProfile = async (e) => {
    e.preventDefault();
    setSaving(true);
    setError('');
    setSuccessMsg('');

    try {
      const addresses = (formData.city || formData.country) ? [{
        city: formData.city.trim(),
        country: formData.country.trim()
      }] : [];

      const payload = {
        firstname: formData.firstname.trim(),
        lastname: formData.lastname.trim(),
        phone: formData.phone.trim(),
        addresses
      };

      if (!isGoogleUser) {
        payload.email = formData.email.trim();
      }

      const response = await authFetch(API_ENDPOINTS.USER, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload)
      });

      if (response.ok) {
        const updated = await response.json();
        setUser(updated);
        setIsEditing(false);
        setSuccessMsg('Profile updated successfully!');
        setTimeout(() => setSuccessMsg(''), 4000);
      } else {
        let msg = 'Failed to update profile.';
        try {
          const errData = await response.json();
          msg = errData.message || errData.error || (typeof errData === 'string' ? errData : JSON.stringify(errData));
        } catch {
          msg = await response.text();
        }
        setError(msg || 'Failed to update profile.');
      }
    } catch (err) {
      setError('Update failed: ' + err.message);
    } finally {
      setSaving(false);
    }
  };

  const openVerifyModal = (type) => {
    setVerifyModal({
      open: true,
      type,
      step: 'send',
      otp: '',
      sendingOtp: false,
      error: '',
      successInfo: ''
    });
  };

  const handleSendOtp = async () => {
    setVerifyModal(prev => ({ ...prev, sendingOtp: true, error: '' }));
    try {
      // Simulate sending OTP delay
      await new Promise(resolve => setTimeout(resolve, 600));
      const dest = verifyModal.type === 'email' ? user?.email : user?.phone;
      setVerifyModal(prev => ({
        ...prev,
        sendingOtp: false,
        step: 'enter',
        successInfo: `OTP sent to ${dest}! (Demo mode: code is 123456)`
      }));
    } catch (err) {
      setVerifyModal(prev => ({
        ...prev,
        sendingOtp: false,
        error: 'Failed to send OTP: ' + err.message
      }));
    }
  };

  const handleConfirmVerification = async () => {
    const { type, otp } = verifyModal;
    if (!type) return;
    if (!otp || otp.trim().length < 4) {
      setVerifyModal(prev => ({ ...prev, error: 'Please enter the 6-digit OTP code.' }));
      return;
    }
    setVerifying(true);
    setVerifyModal(prev => ({ ...prev, error: '' }));
    try {
      const endpoint = type === 'email' ? `${API_ENDPOINTS.USER}/verify/email` : `${API_ENDPOINTS.USER}/verify/phone`;
      const response = await authFetch(endpoint, {
        method: 'POST'
      });
      if (response.ok) {
        const data = await response.json();
        if (data.user) {
          setUser(data.user);
        } else {
          await fetchUserProfile();
        }
        setVerifyModal({
          open: false,
          type: null,
          step: 'send',
          otp: '',
          sendingOtp: false,
          error: '',
          successInfo: ''
        });
        setSuccessMsg(type === 'email' ? 'Email verified successfully!' : 'Phone number verified successfully!');
        setTimeout(() => setSuccessMsg(''), 4000);
      } else {
        let msg = 'Verification failed.';
        try {
          const errData = await response.json();
          msg = errData.message || errData.error || msg;
        } catch {
          msg = await response.text();
        }
        setVerifyModal(prev => ({ ...prev, error: msg }));
      }
    } catch (err) {
      setVerifyModal(prev => ({ ...prev, error: 'Verification failed: ' + err.message }));
    } finally {
      setVerifying(false);
    }
  };


  const handleCurrencyChangeDirect = async (newCurrency) => {
    if (!newCurrency) return;
    try {
      const response = await authFetch(API_ENDPOINTS.USER, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          currency: newCurrency
        })
      });

      if (response.ok) {
        const updated = await response.json();
        setUser(updated);
        setFormData(prev => ({ ...prev, currency: newCurrency }));
        if (updateHomeCurrency) {
          updateHomeCurrency(newCurrency);
        } else if (setCurrency) {
          setCurrency(newCurrency);
        }
        setSuccessMsg(`Account currency updated to ${newCurrency}!`);
        setTimeout(() => setSuccessMsg(''), 3000);
      } else {
        setError('Failed to update currency setting.');
      }
    } catch (err) {
      setError('Error updating currency: ' + err.message);
    }
  };

  const handleUpiChangeDirect = async (newUpi) => {
    try {
      setError('');
      const cleanUpi = newUpi ? newUpi.trim() : '';
      const response = await authFetch(API_ENDPOINTS.USER, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          upiId: cleanUpi || null
        })
      });

      if (response.ok) {
        const updated = await response.json();
        setUser(updated);
        setIsEditingUpiDirect(false);
        setSuccessMsg(cleanUpi ? `UPI ID updated to ${cleanUpi}!` : 'UPI ID removed.');
        setTimeout(() => setSuccessMsg(''), 3000);
      } else {
        let msg = 'Failed to update UPI ID.';
        try {
          const errData = await response.json();
          msg = errData.message || errData.error || msg;
        } catch {
          msg = await response.text();
        }
        setError(msg || 'Failed to update UPI ID.');
      }
    } catch (err) {
      setError('Error updating UPI ID: ' + err.message);
    }
  };

  const handleChangePassword = async (e) => {
    e.preventDefault();
    setPasswordError('');
    setPasswordSuccess('');

    if (newPassword.length < 6) {
      setPasswordError('Password must be at least 6 characters long.');
      return;
    }

    if (newPassword !== confirmPassword) {
      setPasswordError('Passwords do not match.');
      return;
    }

    setChangingPassword(true);
    try {
      const response = await authFetch(API_ENDPOINTS.USER, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          password: newPassword
        })
      });

      if (response.ok) {
        setPasswordSuccess('Password changed successfully!');
        setNewPassword('');
        setConfirmPassword('');
        setTimeout(() => {
          setShowPasswordModal(false);
          setPasswordSuccess('');
        }, 2000);
      } else {
        setPasswordError('Failed to change password.');
      }
    } catch (err) {
      setPasswordError('Error: ' + err.message);
    } finally {
      setChangingPassword(false);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[350px]">
        <div className="w-10 h-10 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
        <p className="mt-4 text-gray-500 dark:text-gray-400 text-sm">Loading your profile...</p>
      </div>
    );
  }

  const displayName = [user?.firstname, user?.lastname].filter(Boolean).join(' ') || user?.username || 'User';
  const currentAddress = (user?.addresses && user.addresses.length > 0) ? user.addresses[0] : null;
  const locationString = [currentAddress?.city, currentAddress?.country].filter(Boolean).join(', ');

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100">User Profile</h2>
          <p className="text-gray-500 dark:text-gray-400 text-sm">Manage your account and preferences</p>
        </div>
        <button
          onClick={handleLogout}
          className="flex items-center space-x-2 px-4 py-2 border border-red-200 dark:border-red-800/60 text-red-600 dark:text-red-400 rounded-xl hover:bg-red-50 dark:hover:bg-red-950/30 transition-colors text-sm font-medium"
        >
          <LogOut size={16} />
          <span>Sign Out</span>
        </button>
      </div>

      {successMsg && (
        <div className="p-4 bg-green-50 dark:bg-green-950/30 border border-green-200 dark:border-green-800 text-green-700 dark:text-green-300 text-sm rounded-xl flex items-center space-x-2">
          <CheckCircle2 size={18} className="text-green-600 dark:text-green-400 flex-shrink-0" />
          <span>{successMsg}</span>
        </div>
      )}

      {error && (
        <div className="p-4 bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-300 text-sm rounded-xl flex items-center space-x-2">
          <AlertCircle size={18} className="text-red-600 dark:text-red-400 flex-shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Main Profile Card */}
      <div className="bg-white dark:bg-gray-900 rounded-3xl border border-gray-200/80 dark:border-gray-800 shadow-sm overflow-hidden">
        {/* Banner / Cover Image */}
        <div className="h-36 sm:h-44 bg-gradient-to-r from-blue-700 via-indigo-700 to-violet-800 relative overflow-hidden">
          <div className="absolute -right-10 -top-10 w-48 h-48 rounded-full bg-white/10 blur-2xl pointer-events-none" />
          <div className="absolute left-1/4 -bottom-10 w-48 h-48 rounded-full bg-indigo-400/20 blur-2xl pointer-events-none" />
        </div>

        {/* Profile Details */}
        <div className="px-6 sm:px-8 pb-6 pt-0 relative">
          {/* Avatar & Edit Action Bar */}
          <div className="flex flex-row items-end justify-between -mt-14 sm:-mt-16 mb-4 gap-4">
            <div className="relative inline-block">
              <div className="w-24 h-24 sm:w-28 sm:h-28 rounded-2xl sm:rounded-3xl bg-gradient-to-br from-blue-600 to-indigo-700 border-4 border-white dark:border-gray-900 shadow-xl flex items-center justify-center text-white text-3xl sm:text-4xl font-extrabold uppercase tracking-wider ring-1 ring-black/5">
                {displayName.charAt(0)}
              </div>
              {user?.premium && (
                <div className="absolute -bottom-1 -right-1 bg-amber-500 text-white p-1.5 rounded-xl shadow-md border-2 border-white dark:border-gray-900" title="Premium Member">
                  <Sparkles size={14} />
                </div>
              )}
            </div>

            <div>
              <button
                onClick={() => setIsEditing(!isEditing)}
                className={`flex items-center space-x-2 px-4 py-2.5 rounded-xl text-sm font-semibold transition-all shadow-xs ${
                  isEditing 
                    ? 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700 border border-gray-300 dark:border-gray-700' 
                    : 'bg-blue-600 text-white hover:bg-blue-700 hover:shadow-md'
                }`}
              >
                {isEditing ? <X size={16} /> : <Edit3 size={16} />}
                <span>{isEditing ? 'Cancel Edit' : 'Edit Profile'}</span>
              </button>
            </div>
          </div>

          {/* User Name & Details */}
          <div className="space-y-1 mb-5">
            <div className="flex flex-wrap items-center gap-2.5">
              <h3 className="text-2xl sm:text-3xl font-extrabold text-gray-900 dark:text-gray-100 tracking-tight">
                {displayName}
              </h3>
              {user?.premium && (
                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold bg-amber-50 dark:bg-amber-950/40 text-amber-800 dark:text-amber-300 border border-amber-200 dark:border-amber-800/50 shadow-2xs">
                  <Sparkles size={12} className="mr-1 text-amber-600" /> Premium
                </span>
              )}
            </div>

            <div className="flex flex-wrap items-center gap-y-1 gap-x-3 text-xs sm:text-sm text-gray-500 dark:text-gray-400 pt-0.5">
              <span className="font-semibold text-gray-700 dark:text-gray-300">@{user?.username}</span>
              {locationString && (
                <>
                  <span className="text-gray-300 dark:text-gray-700">&bull;</span>
                  <span className="flex items-center gap-1 font-medium text-gray-600 dark:text-gray-300">
                    <MapPin size={14} className="text-blue-600 dark:text-blue-400" />
                    {locationString}
                  </span>
                </>
              )}
              {user?.currency && (
                <>
                  <span className="text-gray-300 dark:text-gray-700">&bull;</span>
                  <span className="flex items-center gap-1 font-medium text-gray-600 dark:text-gray-300">
                    <Globe size={14} className="text-emerald-600 dark:text-emerald-400" />
                    Preferred: <strong className="text-gray-800 dark:text-gray-200">{user.currency}</strong>
                  </span>
                </>
              )}
            </div>
          </div>

          {/* Form or Clean Overview */}
          {isEditing ? (
            <form onSubmit={handleUpdateProfile} className="mt-6 pt-6 border-t border-gray-100 dark:border-gray-800 space-y-4">
              <h4 className="text-sm font-bold text-gray-900 dark:text-gray-100 mb-2">Edit Account Information</h4>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">First Name</label>
                  <input
                    type="text"
                    value={formData.firstname}
                    onChange={(e) => setFormData({ ...formData, firstname: e.target.value })}
                    className="w-full px-3 py-2 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-700 text-gray-900 dark:text-gray-100 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                    placeholder="First Name"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">Last Name</label>
                  <input
                    type="text"
                    value={formData.lastname}
                    onChange={(e) => setFormData({ ...formData, lastname: e.target.value })}
                    className="w-full px-3 py-2 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-700 text-gray-900 dark:text-gray-100 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                    placeholder="Last Name"
                  />
                </div>

                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="block text-xs font-medium text-gray-700 dark:text-gray-300">Email Address</label>
                    {isGoogleUser && (
                      <span className="text-[10px] font-semibold text-amber-600 dark:text-amber-400 flex items-center gap-1">
                        <Lock size={10} /> Google Managed
                      </span>
                    )}
                  </div>
                  <input
                    type="email"
                    value={formData.email}
                    disabled={isGoogleUser}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    className={`w-full px-3 py-2 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-700 text-gray-900 dark:text-gray-100 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm ${
                      isGoogleUser ? 'bg-gray-100 dark:bg-gray-800/80 text-gray-500 dark:text-gray-400 cursor-not-allowed opacity-80' : ''
                    }`}
                    placeholder="name@example.com"
                  />
                  {isGoogleUser && (
                    <p className="text-[11px] text-gray-400 dark:text-gray-500 mt-1">
                      Email is authenticated via Google OAuth and cannot be modified.
                    </p>
                  )}
                </div>

                <div>
                  <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">Phone Number</label>
                  <input
                    type="tel"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    className="w-full px-3 py-2 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-700 text-gray-900 dark:text-gray-100 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                    placeholder="+91 9876543210"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">City</label>
                  <input
                    type="text"
                    value={formData.city}
                    onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                    className="w-full px-3 py-2 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-700 text-gray-900 dark:text-gray-100 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                    placeholder="e.g. Mumbai, New York"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">Country</label>
                  <input
                    type="text"
                    value={formData.country}
                    onChange={(e) => handleCountryChange(e.target.value)}
                    className="w-full px-3 py-2 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-700 text-gray-900 dark:text-gray-100 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                    placeholder="e.g. India, United States"
                  />
                </div>
              </div>

              <div className="flex justify-end space-x-3 pt-3">
                <button
                  type="button"
                  onClick={() => setIsEditing(false)}
                  className="px-4 py-2 border border-gray-300 dark:border-gray-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 text-sm font-medium"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="flex items-center space-x-2 px-5 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm font-semibold disabled:opacity-50"
                >
                  {saving ? (
                    <span>Saving...</span>
                  ) : (
                    <>
                      <Check size={16} />
                      <span>Save Changes</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 mt-6 pt-6 border-t border-gray-100 dark:border-gray-800">
              <div className="flex items-center space-x-3 p-3.5 bg-gray-50 dark:bg-gray-800/60 rounded-xl">
                <div className="p-2 bg-blue-100 dark:bg-blue-900/40 text-blue-600 dark:text-blue-400 rounded-lg">
                  <Mail size={18} />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center justify-between gap-1">
                    <p className="text-xs font-medium text-gray-400 dark:text-gray-500 uppercase tracking-wider">Email</p>
                    {user?.email && (
                      user?.emailVerified ? (
                        <span title="Email Verified" className="text-emerald-600 dark:text-emerald-400 flex items-center">
                          <CheckCircle2 size={16} />
                        </span>
                      ) : (
                        <button
                          type="button"
                          onClick={() => openVerifyModal('email')}
                          title="Unverified Email - Click to verify"
                          className="text-amber-500 hover:text-amber-600 dark:text-amber-400 dark:hover:text-amber-300 transition-transform hover:scale-115 p-0.5 rounded-full hover:bg-amber-50 dark:hover:bg-amber-950/40"
                        >
                          <AlertCircle size={16} />
                        </button>
                      )
                    )}
                  </div>
                  <p className="text-sm font-semibold text-gray-900 dark:text-gray-100 truncate mt-0.5">{user?.email || 'Not set'}</p>
                </div>
              </div>

              <div className="flex items-center space-x-3 p-3.5 bg-gray-50 dark:bg-gray-800/60 rounded-xl">
                <div className="p-2 bg-green-100 dark:bg-green-900/40 text-green-600 dark:text-green-400 rounded-lg">
                  <Phone size={18} />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center justify-between gap-1">
                    <p className="text-xs font-medium text-gray-400 dark:text-gray-500 uppercase tracking-wider">Phone</p>
                    {user?.phone && (
                      user?.phoneVerified ? (
                        <span title="Phone Verified" className="text-emerald-600 dark:text-emerald-400 flex items-center">
                          <CheckCircle2 size={16} />
                        </span>
                      ) : (
                        <button
                          type="button"
                          onClick={() => openVerifyModal('phone')}
                          title="Unverified Phone - Click to verify"
                          className="text-amber-500 hover:text-amber-600 dark:text-amber-400 dark:hover:text-amber-300 transition-transform hover:scale-115 p-0.5 rounded-full hover:bg-amber-50 dark:hover:bg-amber-950/40"
                        >
                          <AlertCircle size={16} />
                        </button>
                      )
                    )}
                  </div>
                  <p className="text-sm font-semibold text-gray-900 dark:text-gray-100 mt-0.5">{user?.phone || 'Not set'}</p>
                </div>
              </div>

              <div className="flex items-center space-x-3 p-3.5 bg-gray-50 dark:bg-gray-800/60 rounded-xl">
                <div className="p-2 bg-indigo-100 dark:bg-indigo-900/40 text-indigo-600 dark:text-indigo-400 rounded-lg">
                  <QrCode size={18} />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-xs font-medium text-gray-400 dark:text-gray-500 uppercase tracking-wider">UPI ID / VPA</p>
                  <p className="text-sm font-semibold text-gray-900 dark:text-gray-100 truncate">{user?.upiId || 'Not configured'}</p>
                </div>
              </div>

              <div className="flex items-center space-x-3 p-3.5 bg-gray-50 dark:bg-gray-800/60 rounded-xl">
                <div className="p-2 bg-purple-100 dark:bg-purple-900/40 text-purple-600 dark:text-purple-400 rounded-lg">
                  <Shield size={18} />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-xs font-medium text-gray-400 dark:text-gray-500 uppercase tracking-wider">Account Role</p>
                  <p className="text-sm font-semibold text-gray-900 dark:text-gray-100">{user?.role || 'USER'}</p>
                </div>
              </div>

              <div className="flex items-center space-x-3 p-3.5 bg-gray-50 dark:bg-gray-800/60 rounded-xl sm:col-span-2 md:col-span-2">
                <div className="p-2 bg-amber-100 dark:bg-amber-900/40 text-amber-600 dark:text-amber-400 rounded-lg">
                  <Calendar size={18} />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-xs font-medium text-gray-400 dark:text-gray-500 uppercase tracking-wider">Member Since</p>
                  <p className="text-sm font-semibold text-gray-900 dark:text-gray-100">
                    {user?.createdAt ? new Date(user.createdAt).toLocaleDateString(undefined, { year: 'numeric', month: 'short' }) : 'Recently'}
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Account Settings Menu */}
      <div className="bg-white dark:bg-gray-900 p-6 rounded-2xl border border-gray-200 dark:border-gray-800 shadow-sm space-y-3">
        <h4 className="text-base font-bold text-gray-900 dark:text-gray-100 mb-1">Preferences & Security</h4>
        
        <div className="divide-y divide-gray-100 dark:divide-gray-800">
          {/* Account Base Currency Preference */}
          <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center py-3.5 gap-2">
            <div>
              <p className="font-semibold text-gray-900 dark:text-gray-100 text-sm">Account Base Currency</p>
              <p className="text-xs text-gray-500 dark:text-gray-400">All balances, expenses, investments, and reports use this base currency</p>
            </div>
            <div className="flex items-center gap-2 self-start sm:self-auto">
              <select
                value={user?.currency || homeCurrency || 'USD'}
                onChange={(e) => handleCurrencyChangeDirect(e.target.value)}
                className="text-xs font-semibold bg-gray-50 dark:bg-gray-800 text-gray-800 dark:text-gray-100 border border-gray-200 dark:border-gray-700 rounded-xl px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer transition-colors shadow-2xs"
              >
                {getAvailableCurrencies(user?.currency || homeCurrency).map(c => (
                  <option key={c.code} value={c.code}>
                    {c.code} ({c.symbol}) - {c.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* UPI ID for P2P Settlements Preference */}
          <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center py-3.5 gap-2">
            <div>
              <p className="font-semibold text-gray-900 dark:text-gray-100 text-sm flex items-center gap-1.5">
                <QrCode size={15} className="text-indigo-600 dark:text-indigo-400" />
                <span>UPI ID / VPA</span>
              </p>
              <p className="text-xs text-gray-500 dark:text-gray-400">Used when other people settle up with you or send payments via UPI</p>
            </div>
            <div className="flex items-center gap-2 self-start sm:self-auto">
              {isEditingUpiDirect ? (
                <div className="flex items-center gap-1.5">
                  <input
                    type="text"
                    value={upiDirectInput}
                    onChange={(e) => setUpiDirectInput(e.target.value)}
                    placeholder="e.g. name@okhdfcbank"
                    className="text-xs font-semibold bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 border border-gray-300 dark:border-gray-700 rounded-xl px-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-blue-500 w-48"
                  />
                  <button
                    onClick={() => handleUpiChangeDirect(upiDirectInput)}
                    className="px-2.5 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold transition-colors"
                  >
                    Save
                  </button>
                  <button
                    onClick={() => setIsEditingUpiDirect(false)}
                    className="px-2 py-1.5 text-gray-500 hover:text-gray-700 dark:hover:text-gray-300 text-xs"
                  >
                    Cancel
                  </button>
                </div>
              ) : (
                <div className="flex items-center gap-2">
                  <span className="text-xs font-semibold bg-gray-50 dark:bg-gray-800 text-gray-800 dark:text-gray-200 border border-gray-200 dark:border-gray-700 rounded-xl px-3 py-1.5">
                    {user?.upiId || 'Not configured'}
                  </span>
                  <button
                    onClick={() => {
                      setUpiDirectInput(user?.upiId || '');
                      setIsEditingUpiDirect(true);
                    }}
                    className="px-2.5 py-1.5 text-xs font-semibold text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-950/40 rounded-xl transition-colors border border-blue-200 dark:border-blue-800"
                  >
                    {user?.upiId ? 'Edit' : 'Set UPI ID'}
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Theme Preference Toggle */}
          <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center py-3.5 gap-2">
            <div>
              <p className="font-semibold text-gray-900 dark:text-gray-100 text-sm">Theme Preference</p>
              <p className="text-xs text-gray-500 dark:text-gray-400">Switch between light and dark visual mode</p>
            </div>
            <div className="flex items-center bg-gray-100 dark:bg-gray-800 p-1 rounded-xl border border-gray-200 dark:border-gray-700 self-start sm:self-auto">
              <button
                type="button"
                onClick={() => setTheme('light')}
                className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                  theme === 'light'
                    ? 'bg-white dark:bg-gray-700 text-gray-900 dark:text-white shadow-xs'
                    : 'text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white'
                }`}
              >
                <Sun size={14} className="text-amber-500" />
                <span>Light</span>
              </button>
              <button
                type="button"
                onClick={() => setTheme('dark')}
                className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                  theme === 'dark'
                    ? 'bg-gray-700 dark:bg-blue-600 text-white shadow-xs'
                    : 'text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white'
                }`}
              >
                <Moon size={14} className="text-blue-400" />
                <span>Dark</span>
              </button>
            </div>
          </div>

          <div className="flex justify-between items-center py-3.5">
            <div>
              <p className="font-semibold text-gray-900 dark:text-gray-100 text-sm">Account Password</p>
              <p className="text-xs text-gray-500 dark:text-gray-400">Update your password to keep your account secure</p>
            </div>
            <button 
              onClick={() => setShowPasswordModal(true)}
              className="px-3.5 py-1.5 text-xs font-semibold text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-950/40 rounded-lg transition-colors border border-blue-200 dark:border-blue-800"
            >
              Change Password
            </button>
          </div>

          <div className="flex justify-between items-center py-3.5">
            <div>
              <p className="font-semibold text-gray-900 dark:text-gray-100 text-sm">Account Status</p>
              <p className="text-xs text-gray-500 dark:text-gray-400">Active membership &bull; {user?.premium ? 'Premium Tier' : 'Standard Plan'}</p>
            </div>
            <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-green-50 dark:bg-green-950/40 text-green-700 dark:text-green-300 border border-green-200 dark:border-green-800/40">
              Active
            </span>
          </div>
        </div>
      </div>

      {/* Password Change Modal */}
      {showPasswordModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-gray-900 rounded-2xl max-w-md w-full p-6 shadow-xl border border-gray-200 dark:border-gray-800 animate-in fade-in zoom-in duration-200">
            <div className="flex justify-between items-center mb-4">
              <div className="flex items-center space-x-2">
                <div className="p-2 bg-blue-100 dark:bg-blue-900/40 text-blue-600 dark:text-blue-400 rounded-lg">
                  <Lock size={18} />
                </div>
                <h3 className="text-lg font-bold text-gray-900 dark:text-gray-100">Change Password</h3>
              </div>
              <button 
                onClick={() => setShowPasswordModal(false)}
                className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"
              >
                <X size={20} />
              </button>
            </div>

            {passwordError && (
              <div className="mb-4 p-3 bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-300 text-xs rounded-lg flex items-center space-x-2">
                <AlertCircle size={16} className="flex-shrink-0" />
                <span>{passwordError}</span>
              </div>
            )}

            {passwordSuccess && (
              <div className="mb-4 p-3 bg-green-50 dark:bg-green-950/30 border border-green-200 dark:border-green-800 text-green-700 dark:text-green-300 text-xs rounded-lg flex items-center space-x-2">
                <CheckCircle2 size={16} className="flex-shrink-0" />
                <span>{passwordSuccess}</span>
              </div>
            )}

            <form onSubmit={handleChangePassword} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">New Password</label>
                <input
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  required
                  placeholder="At least 6 characters"
                  className="w-full px-3 py-2 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-700 text-gray-900 dark:text-gray-100 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">Confirm New Password</label>
                <input
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  required
                  placeholder="Re-enter password"
                  className="w-full px-3 py-2 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-700 text-gray-900 dark:text-gray-100 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                />
              </div>

              <div className="flex justify-end space-x-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowPasswordModal(false)}
                  className="px-4 py-2 border border-gray-300 dark:border-gray-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 text-sm font-medium"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={changingPassword}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm font-semibold disabled:opacity-50"
                >
                  {changingPassword ? 'Updating...' : 'Update Password'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Verification Modal */}
      {verifyModal.open && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-gray-900 rounded-2xl max-w-md w-full p-6 shadow-2xl border border-gray-200 dark:border-gray-800 animate-in fade-in zoom-in duration-200">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center space-x-2.5">
                <div className="p-2 bg-blue-100 dark:bg-blue-900/40 text-blue-600 dark:text-blue-400 rounded-xl">
                  {verifyModal.type === 'email' ? <Mail size={20} /> : <Phone size={20} />}
                </div>
                <div>
                  <h3 className="text-base font-bold text-gray-900 dark:text-gray-100">
                    Verify {verifyModal.type === 'email' ? 'Email Address' : 'Phone Number'}
                  </h3>
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    {verifyModal.type === 'email' ? user?.email : user?.phone}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setVerifyModal({ open: false, type: null, step: 'send', otp: '', sendingOtp: false, error: '', successInfo: '' })}
                className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 p-1"
              >
                <X size={20} />
              </button>
            </div>

            {verifyModal.error && (
              <div className="mb-3 p-2.5 bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-300 text-xs rounded-lg flex items-center space-x-2">
                <AlertCircle size={15} className="flex-shrink-0" />
                <span>{verifyModal.error}</span>
              </div>
            )}

            {verifyModal.step === 'send' ? (
              <div className="space-y-4 my-3">
                <p className="text-xs text-gray-600 dark:text-gray-300 leading-relaxed">
                  We need to verify your {verifyModal.type === 'email' ? 'email address' : 'phone number'}. Click <strong>Send OTP</strong> below to generate a 6-digit verification code.
                </p>
                <div className="p-3 bg-gray-50 dark:bg-gray-800/60 rounded-xl border border-gray-100 dark:border-gray-800 flex items-center justify-between">
                  <span className="text-xs text-gray-500 dark:text-gray-400">Destination:</span>
                  <span className="text-xs font-semibold text-gray-900 dark:text-gray-100">
                    {verifyModal.type === 'email' ? user?.email : user?.phone}
                  </span>
                </div>
                <div className="flex items-center justify-end gap-2.5 pt-2">
                  <button
                    type="button"
                    onClick={() => setVerifyModal({ open: false, type: null, step: 'send', otp: '', sendingOtp: false, error: '', successInfo: '' })}
                    className="px-4 py-2 text-xs font-semibold text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={handleSendOtp}
                    disabled={verifyModal.sendingOtp}
                    className="flex items-center gap-1.5 px-5 py-2 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-lg shadow-xs transition-colors disabled:opacity-50"
                  >
                    {verifyModal.sendingOtp ? (
                      <span>Sending OTP...</span>
                    ) : (
                      <span>Send OTP</span>
                    )}
                  </button>
                </div>
              </div>
            ) : (
              <div className="space-y-4 my-3">
                {verifyModal.successInfo && (
                  <div className="p-2.5 bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800 text-emerald-700 dark:text-emerald-300 text-xs rounded-lg flex items-center space-x-2">
                    <CheckCircle2 size={15} className="flex-shrink-0" />
                    <span>{verifyModal.successInfo}</span>
                  </div>
                )}
                <div>
                  <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">
                    Enter 6-Digit OTP
                  </label>
                  <input
                    type="text"
                    maxLength={6}
                    value={verifyModal.otp}
                    onChange={(e) => setVerifyModal(prev => ({ ...prev, otp: e.target.value }))}
                    className="w-full text-center tracking-widest font-mono text-lg font-bold px-3 py-2 bg-gray-50 dark:bg-gray-800 border border-gray-300 dark:border-gray-700 text-gray-900 dark:text-gray-100 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="123456"
                    autoFocus
                  />
                  <div className="flex items-center justify-between text-[11px] text-gray-400 dark:text-gray-500 mt-1.5 px-1">
                    <span>Demo mode: enter 123456</span>
                    <button
                      type="button"
                      onClick={handleSendOtp}
                      disabled={verifyModal.sendingOtp}
                      className="text-blue-600 dark:text-blue-400 hover:underline font-medium"
                    >
                      Resend OTP
                    </button>
                  </div>
                </div>

                <div className="flex items-center justify-end gap-2.5 pt-2">
                  <button
                    type="button"
                    onClick={() => setVerifyModal({ open: false, type: null, step: 'send', otp: '', sendingOtp: false, error: '', successInfo: '' })}
                    disabled={verifying}
                    className="px-4 py-2 text-xs font-semibold text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={handleConfirmVerification}
                    disabled={verifying}
                    className="flex items-center gap-1.5 px-5 py-2 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-lg shadow-xs transition-colors disabled:opacity-50"
                  >
                    {verifying ? (
                      <span>Verifying...</span>
                    ) : (
                      <>
                        <Check size={14} />
                        <span>Verify OTP</span>
                      </>
                    )}
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default ProfileContent;