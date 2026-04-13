import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Shield, Zap, Bell, Users, Eye, EyeOff, Mail } from 'lucide-react';
import { useLang } from '../i18n/LanguageContext';
import LangToggle from '../components/LangToggle';
import { useAuth } from '../context/AuthContext';
import { login } from '../api/auth';
import ErrorAlert from '../components/ErrorAlert';
import petpalPaw from '../assets/petpal-icon.svg';
import petpalLogo from '../assets/petpal-logo.png';

const LoginPage = () => {
  const { t } = useLang();
  const { loginUser } = useAuth();
  const navigate = useNavigate();
  const [showPassword, setShowPassword] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const res = await login({ email, password });
      loginUser(res.data.user, res.data.token);
      navigate(res.data.user?.role === 'admin' ? '/admin' : '/dashboard');
    } catch (err) {
      setError(err.error || err.message || 'Login failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const features = [
    {
      icon: <Shield className="w-5 h-5 text-[#7C3AED]" />,
      titleKey: 'auth_feature_health_title',
      descKey: 'auth_feature_health_desc',
    },
    {
      icon: <Zap className="w-5 h-5 text-[#7C3AED]" />,
      titleKey: 'auth_feature_vets_title',
      descKey: 'auth_feature_vets_desc',
    },
    {
      icon: <Bell className="w-5 h-5 text-[#7C3AED]" />,
      titleKey: 'auth_feature_reminders_title',
      descKey: 'auth_feature_reminders_desc',
    },
    {
      icon: <Users className="w-5 h-5 text-[#7C3AED]" />,
      titleKey: 'auth_feature_community_title',
      descKey: 'auth_feature_community_desc',
    },
  ];

  return (
    <div className="min-h-screen flex flex-col lg:flex-row">
      {/* ── Left Panel ── */}
      <div className="w-full lg:w-1/2 bg-white dark:bg-gray-900 flex flex-col justify-center px-6 sm:px-12 lg:px-20 py-10">
        {/* Top bar: logo + lang toggle */}
        <div className="flex items-center justify-between mb-10">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-2">
            <img src={petpalPaw} alt="PetPal" className="w-9 h-9" />
            <span className="text-2xl font-bold text-gray-900 dark:text-white">
              Pet<span className="text-[#7C3AED]">Pal</span>
            </span>
          </Link>

          <LangToggle />
        </div>

        {/* Form area */}
        <div className="max-w-md w-full mx-auto">
          <h1 className="text-3xl sm:text-4xl font-bold text-gray-900 dark:text-white mb-2">
            {t('auth_login_title')}{' '}
            <span className="text-[#7C3AED]">PetPal</span>
          </h1>

          <form onSubmit={handleSubmit} className="mt-8 space-y-5">
            <ErrorAlert message={error} onClose={() => setError('')} />

            {/* Email */}
            <div>
              <label
                htmlFor="email"
                className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5"
              >
                {t('auth_email')}
              </label>
              <div className="relative">
                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 dark:text-gray-500" />
                <input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder={t('auth_email')}
                  className="rounded-xl border border-[#E5E7EB] dark:border-gray-700 px-4 py-3 pl-12 focus:ring-2 focus:ring-[#7C3AED] focus:border-transparent outline-none w-full"
                  required
                />
              </div>
            </div>

            {/* Password */}
            <div>
              <label
                htmlFor="password"
                className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5"
              >
                {t('auth_password')}
              </label>
              <div className="relative">
                <input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder={t('auth_password')}
                  className="rounded-xl border border-[#E5E7EB] dark:border-gray-700 px-4 py-3 focus:ring-2 focus:ring-[#7C3AED] focus:border-transparent outline-none w-full pr-12"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300 cursor-pointer"
                >
                  {showPassword ? (
                    <EyeOff className="w-5 h-5" />
                  ) : (
                    <Eye className="w-5 h-5" />
                  )}
                </button>
              </div>
            </div>

            {/* Forgot password */}
            <div className="flex justify-end">
              <Link
                to="/forgot-password"
                className="text-sm font-medium text-[#7C3AED] hover:text-[#6D28D9] transition-colors"
              >
                {t('auth_forgot')}
              </Link>
            </div>

            {/* Sign In button */}
            <button
              type="submit"
              disabled={loading}
              className="bg-[#7C3AED] text-white rounded-full py-3 w-full font-semibold hover:bg-[#6D28D9] transition-all shadow-md cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <span className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  {t('auth_logging_in') || 'Signing in...'}
                </span>
              ) : (
                t('auth_login_btn') || t('auth_login_title')
              )}
            </button>
          </form>

          {/* OR divider */}
          <div className="flex items-center gap-4 my-6">
            <div className="flex-1 h-px bg-[#E5E7EB] dark:bg-gray-700" />
            <span className="text-sm text-gray-400 dark:text-gray-500 whitespace-nowrap">
              {t('auth_or_login')}
            </span>
            <div className="flex-1 h-px bg-[#E5E7EB] dark:bg-gray-700" />
          </div>

          {/* Social buttons */}
          <div className="flex flex-col sm:flex-row gap-3">
            <button
              type="button"
              className="flex-1 flex items-center justify-center gap-2 rounded-xl border border-[#E5E7EB] dark:border-gray-700 px-4 py-3 text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors cursor-pointer"
            >
              <svg className="w-5 h-5" viewBox="0 0 24 24">
                <path
                  d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z"
                  fill="#4285F4"
                />
                <path
                  d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                  fill="#34A853"
                />
                <path
                  d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                  fill="#FBBC05"
                />
                <path
                  d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                  fill="#EA4335"
                />
              </svg>
              Google
            </button>

            <button
              type="button"
              className="flex-1 flex items-center justify-center gap-2 rounded-xl border border-[#E5E7EB] dark:border-gray-700 px-4 py-3 text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors cursor-pointer"
            >
              <svg className="w-5 h-5" viewBox="0 0 24 24" fill="#1877F2">
                <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
              </svg>
              Facebook
            </button>
          </div>

          {/* Sign up link */}
          <p className="text-center text-sm text-gray-500 dark:text-gray-400 mt-8">
            {t('auth_no_account')}{' '}
            <Link
              to="/register"
              className="text-[#7C3AED] font-semibold hover:text-[#6D28D9] transition-colors"
            >
              {t('auth_signup')}
            </Link>
          </p>
        </div>
      </div>

      {/* ── Right Panel ── */}
      <div className="hidden lg:flex w-1/2 bg-gradient-to-br from-[#7C3AED] via-[#6D28D9] to-[#5B21B6] flex-col items-center justify-center p-12 relative overflow-hidden">
        {/* Background decorative elements */}
        <div className="absolute top-0 right-0 w-96 h-96 bg-white/5 rounded-full -translate-y-1/2 translate-x-1/3" />
        <div className="absolute bottom-0 left-0 w-72 h-72 bg-white/5 rounded-full translate-y-1/3 -translate-x-1/4" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-white/[0.03] rounded-full" />

        <div className="relative z-10 w-full max-w-md text-center">
          {/* Icon */}
          <div className="w-20 h-20 rounded-2xl bg-white/15 backdrop-blur-sm flex items-center justify-center mx-auto mb-8 shadow-lg">
            <img src={petpalPaw} alt="PetPal" className="w-12 h-12" />
          </div>

          {/* Heading */}
          <h2 className="text-3xl font-bold text-white mb-3">
            {t('auth_welcome_back') || 'Welcome back to PetPal'}
          </h2>
          <p className="text-white/70 text-base leading-relaxed mb-10">
            {t('auth_social_proof_sub') || 'Professional care for your furry best friends.'}
          </p>

          {/* Stats row */}
          <div className="flex items-center justify-center gap-8 mb-10">
            <div className="text-center">
              <p className="text-2xl font-bold text-white">10k+</p>
              <p className="text-xs text-white/60 mt-1">{t('auth_stat_users') || 'Pet Parents'}</p>
            </div>
            <div className="w-px h-10 bg-white/20" />
            <div className="text-center">
              <p className="text-2xl font-bold text-white">50k+</p>
              <p className="text-xs text-white/60 mt-1">{t('auth_stat_diagnoses') || 'Diagnoses'}</p>
            </div>
            <div className="w-px h-10 bg-white/20" />
            <div className="text-center">
              <p className="text-2xl font-bold text-white">99%</p>
              <p className="text-xs text-white/60 mt-1">{t('auth_stat_satisfaction') || 'Satisfaction'}</p>
            </div>
          </div>

          {/* Feature cards - 2x2 grid */}
          <div className="grid grid-cols-2 gap-3">
            {features.map((f, i) => (
              <div
                key={i}
                className="bg-white/10 backdrop-blur-sm rounded-xl p-4 text-left hover:bg-white/15 transition-colors"
              >
                <div className="w-9 h-9 rounded-lg bg-white/15 flex items-center justify-center mb-2.5">
                  <span className="[&>svg]:text-white">{f.icon}</span>
                </div>
                <h3 className="text-sm font-semibold text-white mb-1">
                  {t(f.titleKey)}
                </h3>
                <p className="text-xs text-white/60 leading-relaxed">
                  {t(f.descKey)}
                </p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;
