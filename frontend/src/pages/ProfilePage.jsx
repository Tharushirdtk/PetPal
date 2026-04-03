import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useLang } from '../i18n/LanguageContext';
import { updateProfile, getMe } from '../api/auth';
import ErrorAlert from '../components/ErrorAlert';
import LoadingSpinner from '../components/LoadingSpinner';
import Navbar from '../components/Navbar';
import ThemeToggle from '../components/ThemeToggle';
import { Lock } from 'lucide-react';

export default function ProfilePage() {
  const { user, setUser } = useAuth();
  const { t } = useLang();

  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Form state
  const [formData, setFormData] = useState({
    first_name: '',
    last_name: '',
    phone: '',
    preferred_language: '',
  });

  const [initialData, setInitialData] = useState(null);
  const [isDirty, setIsDirty] = useState(false);

  // Load user data on mount
  useEffect(() => {
    const fetchUser = async () => {
      try {
        const res = await getMe();
        const userData = res.data.user;
        const data = {
          first_name: userData.first_name || '',
          last_name: userData.last_name || '',
          phone: userData.phone || '',
          preferred_language: userData.preferred_language || 'en',
        };
        setFormData(data);
        setInitialData(data);
      } catch (err) {
        setError(err?.error || err?.message || 'Failed to load profile');
      } finally {
        setFetching(false);
      }
    };
    fetchUser();
  }, []);

  // Track if form has changed
  useEffect(() => {
    if (!initialData) return;
    const changed = JSON.stringify(formData) !== JSON.stringify(initialData);
    setIsDirty(changed);
  }, [formData, initialData]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    setError('');
  };

  const handleCancel = () => {
    if (initialData) {
      setFormData(initialData);
      setIsDirty(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccess('');

    try {
      // Validate required fields
      if (!formData.first_name.trim() || !formData.last_name.trim()) {
        setError(t('profile_name_required') || 'First and last name are required');
        setLoading(false);
        return;
      }

      // Validate name length
      if (formData.first_name.length < 2 || formData.first_name.length > 100) {
        setError(t('profile_first_name_length') || 'First name must be between 2 and 100 characters');
        setLoading(false);
        return;
      }
      if (formData.last_name.length < 2 || formData.last_name.length > 100) {
        setError(t('profile_last_name_length') || 'Last name must be between 2 and 100 characters');
        setLoading(false);
        return;
      }

      // Validate phone format if provided
      if (formData.phone && formData.phone.trim()) {
        const phoneRegex = /^[\d\s\-\+\(\)]+$/;
        if (!phoneRegex.test(formData.phone)) {
          setError(t('profile_phone_invalid') || 'Phone number format is invalid');
          setLoading(false);
          return;
        }
      }

      const res = await updateProfile({
        first_name: formData.first_name.trim(),
        last_name: formData.last_name.trim(),
        phone: formData.phone?.trim() || null,
        preferred_language: formData.preferred_language || 'en',
      });

      const updatedUser = res.data.user;
      setUser(updatedUser);
      localStorage.setItem('petpal_user', JSON.stringify(updatedUser));

      // Update initial data so form is no longer dirty
      const newInitialData = {
        first_name: updatedUser.first_name,
        last_name: updatedUser.last_name,
        phone: updatedUser.phone || '',
        preferred_language: updatedUser.preferred_language || 'en',
      };
      setInitialData(newInitialData);
      setFormData(newInitialData);

      setSuccess(t('profile_updated_success') || 'Profile updated successfully!');
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      setError(err?.error || t('profile_update_error') || 'Failed to update profile');
    } finally {
      setLoading(false);
    }
  };

  if (fetching) {
    return (
      <div>
        <Navbar />
        <div className="flex items-center justify-center min-h-screen">
          <LoadingSpinner />
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white dark:bg-gray-900 min-h-screen transition-colors">
      <Navbar />

      <div className="max-w-2xl mx-auto px-6 py-12">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-display font-bold text-gray-900 dark:text-white mb-2">
            {t('profile_title') || 'User Profile'}
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            {t('profile_subtitle') || 'Manage your account settings and preferences'}
          </p>
        </div>

        {/* Error Alert */}
        {error && <ErrorAlert message={error} onClose={() => setError('')} />}

        {/* Success Message */}
        {success && (
          <div className="mb-6 p-4 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg">
            <p className="text-sm text-green-700 dark:text-green-400">{success}</p>
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-8">
          {/* Basic Information Section */}
          <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6">
            <h2 className="text-lg font-display font-bold text-gray-900 dark:text-white mb-6">
              {t('profile_personal_info') || 'Personal Information'}
            </h2>

            <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
              {/* First Name */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  {t('profile_first_name') || 'First Name'}
                </label>
                <input
                  type="text"
                  name="first_name"
                  value={formData.first_name}
                  onChange={handleChange}
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#7C3AED] dark:focus:ring-[#A78BFA] placeholder-gray-400 dark:placeholder-gray-500"
                  placeholder="John"
                />
              </div>

              {/* Last Name */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  {t('profile_last_name') || 'Last Name'}
                </label>
                <input
                  type="text"
                  name="last_name"
                  value={formData.last_name}
                  onChange={handleChange}
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#7C3AED] dark:focus:ring-[#A78BFA] placeholder-gray-400 dark:placeholder-gray-500"
                  placeholder="Doe"
                />
              </div>
            </div>

            {/* Phone */}
            <div className="mt-6">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                {t('profile_phone') || 'Phone Number'} ({t('profile_optional') || 'Optional'})
              </label>
              <input
                type="tel"
                name="phone"
                value={formData.phone}
                onChange={handleChange}
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#7C3AED] dark:focus:ring-[#A78BFA] placeholder-gray-400 dark:placeholder-gray-500"
                placeholder="+1 (555) 123-4567"
              />
            </div>

            {/* Preferred Language */}
            <div className="mt-6">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                {t('profile_language') || 'Preferred Language'}
              </label>
              <select
                name="preferred_language"
                value={formData.preferred_language}
                onChange={handleChange}
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#7C3AED] dark:focus:ring-[#A78BFA]"
              >
                <option value="en">English</option>
                <option value="si">සිංහල (Sinhala)</option>
              </select>
            </div>
          </div>

          {/* Account Security Section */}
          <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6">
            <h2 className="text-lg font-display font-bold text-gray-900 dark:text-white mb-6">
              {t('profile_account_security') || 'Account Security'}
            </h2>

            {/* Email (Read-only) */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                {t('profile_email') || 'Email Address'}
              </label>
              <div className="relative">
                <input
                  type="email"
                  value={user?.email || ''}
                  readOnly
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400 cursor-not-allowed"
                />
                <Lock className="absolute right-3 top-2.5 w-5 h-5 text-gray-400" />
              </div>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-2 flex items-center gap-1">
                <Lock className="w-3 h-3" />
                {t('profile_email_locked') || 'Email cannot be changed. Contact support if you need to update it.'}
              </p>
            </div>

            {/* Member Since */}
            <div className="mt-6">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                {t('profile_member_since') || 'Member Since'}
              </label>
              <div className="px-4 py-2 bg-gray-50 dark:bg-gray-700 rounded-lg">
                <p className="text-sm text-gray-700 dark:text-gray-300">
                  {user?.created_at
                    ? new Date(user.created_at).toLocaleDateString(undefined, {
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric',
                      })
                    : 'N/A'}
                </p>
              </div>
            </div>
          </div>

          {/* Appearance Section */}
          <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6">
            <h2 className="text-lg font-display font-bold text-gray-900 dark:text-white mb-6">
              {t('profile_appearance') || 'Appearance'}
            </h2>

            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium text-gray-900 dark:text-white">
                  {t('profile_dark_mode') || 'Dark Mode'}
                </p>
                <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                  {t('profile_theme_description') || 'Toggle dark mode for a comfortable viewing experience'}
                </p>
              </div>
              <ThemeToggle />
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-3 justify-end">
            <button
              type="button"
              onClick={handleCancel}
              disabled={!isDirty || loading}
              className="px-6 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-700 dark:text-gray-300 font-medium hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {t('profile_cancel') || 'Cancel'}
            </button>
            <button
              type="submit"
              disabled={!isDirty || loading}
              className="px-6 py-2 bg-[#7C3AED] dark:bg-[#A78BFA] text-white rounded-lg font-medium hover:bg-[#6D28D9] dark:hover:bg-[#8B5CF6] transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
            >
              {loading ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  {t('profile_saving') || 'Saving...'}
                </>
              ) : (
                t('profile_save_changes') || 'Save Changes'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
