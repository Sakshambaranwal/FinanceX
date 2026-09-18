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
  Globe
} from 'lucide-react';
import { AppContext } from '../AppContext';
import { useNavigate } from 'react-router-dom';
import { 
  SUPPORTED_CURRENCIES, 
  getCurrencyFromCountry 
} from '../utils/currencyUtils';
import { API_ENDPOINTS } from '../config';

const ProfileContent = () => {
  const { jwt, setJwt, setIsAuthenticated, setCurrency, updateHomeCurrency } = useContext(AppContext);
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
    country: '',
    currency: 'USD'
  });
  const [saving, setSaving] = useState(false);

  // Security / Password modal
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [passwordError, setPasswordError] = useState('');
  const [passwordSuccess, setPasswordSuccess] = useState('');
  const [changingPassword, setChangingPassword] = useState(false);

  const fetchUserProfile = async () => {
    const token = jwt || sessionStorage.getItem('jwt');
    if (!token) {
      navigate('/login');
      return;
    }

    try {
      setLoading(true);
      setError('');
      const response = await fetch(API_ENDPOINTS.USER, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

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
          country: addr.country || '',
          currency: userCurr
        });

        if (updateHomeCurrency) {
          updateHomeCurrency(userCurr);
        } else if (setCurrency) {
          setCurrency(userCurr);
        }
      } else if (response.status === 401 || response.status === 403) {
        handleLogout();
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
  }, [jwt]);

  const handleLogout = () => {
    sessionStorage.removeItem('jwt');
    setJwt(null);
    setIsAuthenticated(false);
    navigate('/login');
  };

  const handleCountryChange = (countryName) => {
    const autoCurr = getCurrencyFromCountry(countryName);
    setFormData(prev => ({
      ...prev,
      country: countryName,
      currency: autoCurr
    }));
  };

  const handleUpdateProfile = async (e) => {
    e.preventDefault();
    const token = jwt || sessionStorage.getItem('jwt');
    setSaving(true);
    setError('');
    setSuccessMsg('');

    try {
      const addresses = (formData.city || formData.country) ? [{
        city: formData.city.trim(),
        country: formData.country.trim()
      }] : [];

      const response = await fetch(API_ENDPOINTS.USER, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          firstname: formData.firstname.trim(),
          lastname: formData.lastname.trim(),
          email: formData.email.trim(),
          phone: formData.phone.trim(),
          currency: formData.currency,
          addresses
        })
      });

      if (response.ok) {
        const updated = await response.json();
        setUser(updated);
        setIsEditing(false);
        if (updateHomeCurrency) {
          updateHomeCurrency(formData.currency);
        } else if (setCurrency) {
          setCurrency(formData.currency);
        }
        setSuccessMsg('Profile updated successfully!');
        setTimeout(() => setSuccessMsg(''), 4000);
      } else {
        const msg = await response.text();
        setError(msg || 'Failed to update profile.');
      }
    } catch (err) {
      setError('Update failed: ' + err.message);
    } finally {
      setSaving(false);
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
    const token = jwt || sessionStorage.getItem('jwt');
    try {
      const response = await fetch(API_ENDPOINTS.USER, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
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
        <p className="mt-4 text-gray-500 text-sm">Loading your profile...</p>
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
          <h2 className="text-2xl font-bold text-gray-900">User Profile</h2>
          <p className="text-gray-500 text-sm">Manage your account and preferences</p>
        </div>
        <button
          onClick={handleLogout}
          className="flex items-center space-x-2 px-4 py-2 border border-red-200 text-red-600 rounded-xl hover:bg-red-50 transition-colors text-sm font-medium"
        >
          <LogOut size={16} />
          <span>Sign Out</span>
        </button>
      </div>

      {successMsg && (
        <div className="p-4 bg-green-50 border border-green-200 text-green-700 text-sm rounded-xl flex items-center space-x-2">
          <CheckCircle2 size={18} className="text-green-600 flex-shrink-0" />
          <span>{successMsg}</span>
        </div>
      )}

      {error && (
        <div className="p-4 bg-red-50 border border-red-200 text-red-700 text-sm rounded-xl flex items-center space-x-2">
          <AlertCircle size={18} className="text-red-600 flex-shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Main Profile Card */}
      <div className="bg-white rounded-3xl border border-gray-200/80 shadow-sm overflow-hidden">
        {/* Banner / Cover Image */}
        <div className="h-36 sm:h-44 bg-gradient-to-r from-blue-700 via-indigo-700 to-violet-800 relative overflow-hidden">
          {/* Subtle decorative ambient lights for depth */}
          <div className="absolute -right-10 -top-10 w-48 h-48 rounded-full bg-white/10 blur-2xl pointer-events-none" />
          <div className="absolute left-1/4 -bottom-10 w-48 h-48 rounded-full bg-indigo-400/20 blur-2xl pointer-events-none" />
        </div>

        {/* Profile Details */}
        <div className="px-6 sm:px-8 pb-6 pt-0 relative">
          {/* Avatar & Edit Action Bar */}
          <div className="flex flex-row items-end justify-between -mt-14 sm:-mt-16 mb-4 gap-4">
            <div className="relative inline-block">
              <div className="w-24 h-24 sm:w-28 sm:h-28 rounded-2xl sm:rounded-3xl bg-gradient-to-br from-blue-600 to-indigo-700 border-4 border-white shadow-xl flex items-center justify-center text-white text-3xl sm:text-4xl font-extrabold uppercase tracking-wider ring-1 ring-black/5">
                {displayName.charAt(0)}
              </div>
              {user?.premium && (
                <div className="absolute -bottom-1 -right-1 bg-amber-500 text-white p-1.5 rounded-xl shadow-md border-2 border-white" title="Premium Member">
                  <Sparkles size={14} />
                </div>
              )}
            </div>

            <div>
              <button
                onClick={() => setIsEditing(!isEditing)}
                className={`flex items-center space-x-2 px-4 py-2.5 rounded-xl text-sm font-semibold transition-all shadow-xs ${
                  isEditing 
                    ? 'bg-gray-100 text-gray-700 hover:bg-gray-200 border border-gray-300' 
                    : 'bg-blue-600 text-white hover:bg-blue-700 hover:shadow-md'
                }`}
              >
                {isEditing ? <X size={16} /> : <Edit3 size={16} />}
                <span>{isEditing ? 'Cancel Edit' : 'Edit Profile'}</span>
              </button>
            </div>
          </div>

          {/* User Name & Details (Cleanly below the cover banner with zero overlap) */}
          <div className="space-y-1 mb-5">
            <div className="flex flex-wrap items-center gap-2.5">
              <h3 className="text-2xl sm:text-3xl font-extrabold text-gray-900 tracking-tight">
                {displayName}
              </h3>
              {user?.premium && (
                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold bg-amber-50 text-amber-800 border border-amber-200 shadow-2xs">
                  <Sparkles size={12} className="mr-1 text-amber-600" /> Premium
                </span>
              )}
            </div>

            <div className="flex flex-wrap items-center gap-y-1 gap-x-3 text-xs sm:text-sm text-gray-500 pt-0.5">
              <span className="font-semibold text-gray-700">@{user?.username}</span>
              {locationString && (
                <>
                  <span className="text-gray-300">&bull;</span>
                  <span className="flex items-center gap-1 font-medium text-gray-600">
                    <MapPin size={14} className="text-blue-600" />
                    {locationString}
                  </span>
                </>
              )}
              {user?.currency && (
                <>
                  <span className="text-gray-300">&bull;</span>
                  <span className="flex items-center gap-1 font-medium text-gray-600">
                    <Globe size={14} className="text-emerald-600" />
                    Preferred: <strong className="text-gray-800">{user.currency}</strong>
                  </span>
                </>
              )}
            </div>
          </div>

          {/* Form or Clean Overview */}
          {isEditing ? (
            <form onSubmit={handleUpdateProfile} className="mt-6 pt-6 border-t border-gray-100 space-y-4">
              <h4 className="text-sm font-bold text-gray-900 mb-2">Edit Account Information</h4>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">First Name</label>
                  <input
                    type="text"
                    value={formData.firstname}
                    onChange={(e) => setFormData({ ...formData, firstname: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                    placeholder="First Name"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Last Name</label>
                  <input
                    type="text"
                    value={formData.lastname}
                    onChange={(e) => setFormData({ ...formData, lastname: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                    placeholder="Last Name"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Email</label>
                  <input
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                    placeholder="name@example.com"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Phone Number</label>
                  <input
                    type="tel"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                    placeholder="+1 555-0199"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">City</label>
                  <input
                    type="text"
                    value={formData.city}
                    onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                    placeholder="e.g. Mumbai, New York"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Country</label>
                  <input
                    type="text"
                    value={formData.country}
                    onChange={(e) => handleCountryChange(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                    placeholder="e.g. India, United States"
                  />
                </div>

                <div className="sm:col-span-2">
                  <label className="block text-xs font-medium text-gray-700 mb-1">Preferred Currency</label>
                  <select
                    value={formData.currency}
                    onChange={(e) => setFormData({ ...formData, currency: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm bg-white"
                  >
                    {SUPPORTED_CURRENCIES.map(c => (
                      <option key={c.code} value={c.code}>
                        {c.code} ({c.symbol}) - {c.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="flex justify-end space-x-3 pt-3">
                <button
                  type="button"
                  onClick={() => setIsEditing(false)}
                  className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 text-sm font-medium"
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
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-6 pt-6 border-t border-gray-100">
              <div className="flex items-center space-x-3 p-3.5 bg-gray-50 rounded-xl">
                <div className="p-2 bg-blue-100 text-blue-600 rounded-lg">
                  <Mail size={18} />
                </div>
                <div>
                  <p className="text-xs font-medium text-gray-400 uppercase tracking-wider">Email</p>
                  <p className="text-sm font-semibold text-gray-900 truncate">{user?.email || 'Not set'}</p>
                </div>
              </div>

              <div className="flex items-center space-x-3 p-3.5 bg-gray-50 rounded-xl">
                <div className="p-2 bg-green-100 text-green-600 rounded-lg">
                  <Phone size={18} />
                </div>
                <div>
                  <p className="text-xs font-medium text-gray-400 uppercase tracking-wider">Phone</p>
                  <p className="text-sm font-semibold text-gray-900">{user?.phone || 'Not set'}</p>
                </div>
              </div>

              <div className="flex items-center space-x-3 p-3.5 bg-gray-50 rounded-xl">
                <div className="p-2 bg-purple-100 text-purple-600 rounded-lg">
                  <Shield size={18} />
                </div>
                <div>
                  <p className="text-xs font-medium text-gray-400 uppercase tracking-wider">Account Role</p>
                  <p className="text-sm font-semibold text-gray-900">{user?.role || 'USER'}</p>
                </div>
              </div>

              <div className="flex items-center space-x-3 p-3.5 bg-gray-50 rounded-xl">
                <div className="p-2 bg-amber-100 text-amber-600 rounded-lg">
                  <Calendar size={18} />
                </div>
                <div>
                  <p className="text-xs font-medium text-gray-400 uppercase tracking-wider">Member Since</p>
                  <p className="text-sm font-semibold text-gray-900">
                    {user?.createdAt ? new Date(user.createdAt).toLocaleDateString(undefined, { year: 'numeric', month: 'short' }) : 'Recently'}
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Account Settings Menu (Clean & Simple) */}
      <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm space-y-3">
        <h4 className="text-base font-bold text-gray-900 mb-1">Account & Security</h4>
        
        <div className="divide-y divide-gray-100">
          <div className="flex justify-between items-center py-3">
            <div>
              <p className="font-semibold text-gray-900 text-sm">Account Password</p>
              <p className="text-xs text-gray-500">Update your password to keep your account secure</p>
            </div>
            <button 
              onClick={() => setShowPasswordModal(true)}
              className="px-3.5 py-1.5 text-xs font-semibold text-blue-600 hover:bg-blue-50 rounded-lg transition-colors border border-blue-200"
            >
              Change Password
            </button>
          </div>

          <div className="flex justify-between items-center py-3">
            <div>
              <p className="font-semibold text-gray-900 text-sm">Account Status</p>
              <p className="text-xs text-gray-500">Active membership &bull; {user?.premium ? 'Premium Tier' : 'Standard Plan'}</p>
            </div>
            <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-green-50 text-green-700">
              Active
            </span>
          </div>
        </div>
      </div>

      {/* Password Change Modal */}
      {showPasswordModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-xl border border-gray-200 animate-in fade-in zoom-in duration-200">
            <div className="flex justify-between items-center mb-4">
              <div className="flex items-center space-x-2">
                <div className="p-2 bg-blue-100 text-blue-600 rounded-lg">
                  <Lock size={18} />
                </div>
                <h3 className="text-lg font-bold text-gray-900">Change Password</h3>
              </div>
              <button 
                onClick={() => setShowPasswordModal(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <X size={20} />
              </button>
            </div>

            {passwordError && (
              <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-700 text-xs rounded-lg flex items-center space-x-2">
                <AlertCircle size={16} className="flex-shrink-0" />
                <span>{passwordError}</span>
              </div>
            )}

            {passwordSuccess && (
              <div className="mb-4 p-3 bg-green-50 border border-green-200 text-green-700 text-xs rounded-lg flex items-center space-x-2">
                <CheckCircle2 size={16} className="flex-shrink-0" />
                <span>{passwordSuccess}</span>
              </div>
            )}

            <form onSubmit={handleChangePassword} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">New Password</label>
                <input
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  required
                  placeholder="At least 6 characters"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">Confirm New Password</label>
                <input
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  required
                  placeholder="Re-enter password"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                />
              </div>

              <div className="flex justify-end space-x-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowPasswordModal(false)}
                  className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 text-sm font-medium"
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
    </div>
  );
};

export default ProfileContent;