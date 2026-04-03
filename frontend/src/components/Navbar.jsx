import { Link, useLocation, useNavigate } from 'react-router-dom';
import { Menu, X, LogOut, ArrowLeft, Settings } from 'lucide-react';
import { useState } from 'react';
import { useLang } from '../i18n/LanguageContext';
import LangToggle from './LangToggle';
import { useAuth } from '../context/AuthContext';
import { logout as logoutApi } from '../api/auth';

const PawIcon = () => (
  <svg viewBox="0 0 24 24" fill="currentColor" className="w-6 h-6 text-[#7C3AED]">
    <path d="M12 10c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2zm-4.5-2c-.83 0-1.5.67-1.5 1.5S6.67 11 7.5 11 9 10.33 9 9.5 8.33 8 7.5 8zm9 0c-.83 0-1.5.67-1.5 1.5s.67 1.5 1.5 1.5 1.5-.67 1.5-1.5S17.33 8 16.5 8zM12 4c-.83 0-1.5.67-1.5 1.5S11.17 7 12 7s1.5-.67 1.5-1.5S12.83 4 12 4zm0 12c-2.21 0-4 1.79-4 4h8c0-2.21-1.79-4-4-4z" />
  </svg>
);

const Navbar = ({ variant = 'default' }) => {
  const { t } = useLang();
  const location = useLocation();
  const navigate = useNavigate();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [dropdownOpen, setDropdownOpen] = useState(false);

  const { user, isAuthenticated, logoutUser } = useAuth();

  const isActive = (paths) => {
    if (Array.isArray(paths)) return paths.some((p) => location.pathname === p);
    return location.pathname === paths;
  };

  const userInitial = user?.name?.charAt(0)?.toUpperCase() || user?.email?.charAt(0)?.toUpperCase() || 'U';

  const handleLogout = async () => {
    try {
      await logoutApi();
    } catch {
      // Even if API fails, proceed with local logout
    }
    logoutUser();
    setDropdownOpen(false);
    navigate('/');
  };

  const closeMobile = () => setMobileOpen(false);

  const linkClass = (active) =>
    `text-sm font-medium no-underline transition-colors ${
      active ? 'text-[#7C3AED] dark:text-[#A78BFA]' : 'text-gray-600 dark:text-gray-400 hover:text-[#7C3AED] dark:hover:text-[#A78BFA]'
    }`;

  // User avatar + dropdown (reusable across variants)
  const UserMenu = () => (
    <div className="relative">
      <div
        className="w-8 h-8 rounded-full bg-[#7C3AED] dark:bg-[#A78BFA] text-white flex items-center justify-center text-sm font-semibold cursor-pointer hover:opacity-90 transition-opacity"
        onClick={() => setDropdownOpen(!dropdownOpen)}
      >
        {userInitial}
      </div>
      {dropdownOpen && (
        <div className="absolute right-0 mt-2 w-48 bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 shadow-lg py-2 z-50">
          <div className="px-4 py-2 border-b border-gray-200 dark:border-gray-700">
            <p className="text-sm font-semibold text-gray-900 dark:text-white truncate">{user?.name || 'User'}</p>
            <p className="text-xs text-gray-500 dark:text-gray-400 truncate">{user?.email || ''}</p>
          </div>
          <Link
            to="/profile"
            onClick={() => setDropdownOpen(false)}
            className="w-full text-left px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors cursor-pointer flex items-center gap-2 no-underline"
          >
            <Settings className="w-4 h-4" />
            {t('nav_profile') || 'Profile'}
          </Link>
          <button
            onClick={handleLogout}
            className="w-full text-left px-4 py-2 text-sm text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors cursor-pointer flex items-center gap-2"
          >
            <LogOut className="w-4 h-4" />
            {t('nav_logout') || 'Logout'}
          </button>
        </div>
      )}
    </div>
  );

  /* ═══════ LANDING VARIANT ═══════ */
  if (variant === 'landing') {
    return (
      <nav className="bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800 sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-6 flex items-center justify-between h-16">
          <Link to="/" className="flex items-center gap-2 no-underline">
            <PawIcon />
            <span className="font-display font-bold text-lg text-gray-900 dark:text-white">PetPal</span>
          </Link>
          <div className="hidden md:flex items-center gap-8">
            {!isAuthenticated && (
              <Link to="/" className={linkClass(isActive('/'))}>{t('nav_home')}</Link>
            )}
            {isAuthenticated ? (
              <Link to="/dashboard" className={linkClass(isActive('/dashboard'))}>{t('nav_dashboard')}</Link>
            ) : (
              <Link to="/diagnosis" className={linkClass(isActive('/diagnosis'))}>{t('nav_diagnosis')}</Link>
            )}
            <a href="#contact" className={linkClass(false)}>{t('nav_contact')}</a>
          </div>
          <div className="flex items-center gap-3">
            <LangToggle />
            {isAuthenticated ? (
              <UserMenu />
            ) : (
              <>
                <Link to="/login" className="text-sm font-medium text-gray-600 dark:text-gray-400 hover:text-[#7C3AED] dark:hover:text-[#A78BFA] transition-colors no-underline hidden sm:block">{t('nav_login')}</Link>
                <Link to="/register" className="bg-[#7C3AED] dark:bg-[#A78BFA] text-white rounded-full px-5 py-2 text-sm font-semibold hover:bg-[#6D28D9] dark:hover:bg-[#8B5CF6] transition-all shadow-md hover:shadow-lg hover:-translate-y-0.5 no-underline">{t('nav_register')}</Link>
              </>
            )}
            <button onClick={() => setMobileOpen(!mobileOpen)} className="md:hidden p-2 cursor-pointer text-gray-900 dark:text-white">
              {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>
        {mobileOpen && (
          <div className="md:hidden border-t border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 px-6 py-4 flex flex-col gap-3">
            {!isAuthenticated && (
              <Link to="/" onClick={closeMobile} className="text-sm font-medium text-gray-600 dark:text-gray-400 no-underline">{t('nav_home')}</Link>
            )}
            {isAuthenticated ? (
              <Link to="/dashboard" onClick={closeMobile} className="text-sm font-medium text-gray-600 dark:text-gray-400 no-underline">{t('nav_dashboard')}</Link>
            ) : (
              <Link to="/diagnosis" onClick={closeMobile} className="text-sm font-medium text-gray-600 dark:text-gray-400 no-underline">{t('nav_diagnosis')}</Link>
            )}
            <a href="#contact" onClick={closeMobile} className="text-sm font-medium text-gray-600 dark:text-gray-400 no-underline">{t('nav_contact')}</a>
            {isAuthenticated ? (
              <button onClick={handleLogout} className="text-sm font-medium text-red-600 dark:text-red-400 no-underline text-left cursor-pointer flex items-center gap-2">
                <LogOut className="w-4 h-4" />
                {t('nav_logout') || 'Logout'}
              </button>
            ) : (
              <Link to="/login" onClick={closeMobile} className="text-sm font-medium text-gray-600 dark:text-gray-400 no-underline">{t('nav_login')}</Link>
            )}
          </div>
        )}
      </nav>
    );
  }

  /* ═══════ ADMIN VARIANT ═══════ */
  if (variant === 'admin') {
    return (
      <nav className="bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800 sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-6 flex items-center justify-between h-16">
          <Link to="/admin" className="flex items-center gap-2 no-underline">
            <PawIcon />
            <span className="font-display font-bold text-lg text-gray-900 dark:text-white">PetPal</span>
            <span className="text-xs bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 px-2 py-0.5 rounded-full font-medium">Admin</span>
          </Link>

          {/* Admin Navigation Links */}
          <div className="hidden md:flex items-center gap-6">
            <Link to="/admin" className={linkClass(isActive('/admin'))}>Admin Panel</Link>
            <Link to="/dashboard" className="text-xs text-gray-400 dark:text-gray-500 hover:text-[#7C3AED] dark:hover:text-[#A78BFA] transition-colors no-underline flex items-center gap-1">
              <ArrowLeft className="w-3 h-3" />
              Back to App
            </Link>
          </div>

          <div className="flex items-center gap-3">
            <LangToggle />
            {isAuthenticated ? (
              <UserMenu />
            ) : (
              <div className="w-8 h-8 rounded-full bg-[#7C3AED] dark:bg-[#A78BFA] text-white flex items-center justify-center text-sm font-semibold">A</div>
            )}
            <button onClick={() => setMobileOpen(!mobileOpen)} className="md:hidden p-2 cursor-pointer text-gray-900 dark:text-white">
              {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>

        {/* Mobile Navigation */}
        {mobileOpen && (
          <div className="md:hidden border-t border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 px-6 py-4 flex flex-col gap-3">
            <Link to="/admin" onClick={closeMobile} className="text-sm font-medium text-gray-600 dark:text-gray-400 no-underline">Admin Panel</Link>
            <Link to="/dashboard" onClick={closeMobile} className="text-sm font-medium text-gray-400 dark:text-gray-500 no-underline flex items-center gap-1">
              <ArrowLeft className="w-3 h-3" />
              Back to App
            </Link>
            {isAuthenticated && (
              <button onClick={handleLogout} className="text-sm font-medium text-red-600 dark:text-red-400 no-underline text-left cursor-pointer flex items-center gap-2">
                <LogOut className="w-4 h-4" />
                {t('nav_logout') || 'Logout'}
              </button>
            )}
          </div>
        )}
      </nav>
    );
  }

  /* ═══════ DEFAULT VARIANT — all app pages ═══════ */
  return (
    <nav className="bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800 sticky top-0 z-40">
      <div className="max-w-7xl mx-auto px-6 flex items-center justify-between h-16">
        <Link to={isAuthenticated ? '/dashboard' : '/'} className="flex items-center gap-2 no-underline">
          <PawIcon />
          <span className="font-display font-bold text-lg text-gray-900 dark:text-white">PetPal</span>
        </Link>
        <div className="hidden md:flex items-center gap-8">
          {!isAuthenticated && (
            <Link to="/" className={linkClass(isActive('/'))}>{t('nav_home')}</Link>
          )}
          <Link to="/dashboard" className={linkClass(isActive('/dashboard'))}>{t('nav_dashboard')}</Link>
          <Link to="/records" className={linkClass(isActive('/records'))}>{t('nav_records')}</Link>
          {user?.role === 'admin' && (
            <Link to="/admin" className={linkClass(isActive('/admin'))}>
              <span className="flex items-center gap-1">
                Admin Panel
                <span className="text-xs bg-[#7C3AED] dark:bg-[#A78BFA] text-white px-2 py-0.5 rounded-full font-medium">Admin</span>
              </span>
            </Link>
          )}
        </div>
        <div className="flex items-center gap-3">
          <LangToggle />
          {isAuthenticated ? (
            <UserMenu />
          ) : (
            <Link to="/login" className="text-sm font-medium text-gray-600 dark:text-gray-400 hover:text-[#7C3AED] dark:hover:text-[#A78BFA] transition-colors no-underline">{t('nav_login')}</Link>
          )}
          <button onClick={() => setMobileOpen(!mobileOpen)} className="md:hidden p-2 cursor-pointer text-gray-900 dark:text-white">
            {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </div>
      {mobileOpen && (
        <div className="md:hidden border-t border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 px-6 py-4 flex flex-col gap-3">
          {!isAuthenticated && (
            <Link to="/" onClick={closeMobile} className="text-sm font-medium text-gray-600 dark:text-gray-400 no-underline">{t('nav_home')}</Link>
          )}
          <Link to="/dashboard" onClick={closeMobile} className="text-sm font-medium text-gray-600 dark:text-gray-400 no-underline">{t('nav_dashboard')}</Link>
          <Link to="/records" onClick={closeMobile} className="text-sm font-medium text-gray-600 dark:text-gray-400 no-underline">{t('nav_records')}</Link>
          {user?.role === 'admin' && (
            <Link to="/admin" onClick={closeMobile} className="text-sm font-medium text-[#7C3AED] dark:text-[#A78BFA] no-underline flex items-center gap-2">
              Admin Panel
              <span className="text-xs bg-[#7C3AED] dark:bg-[#A78BFA] text-white px-2 py-0.5 rounded-full font-medium">Admin</span>
            </Link>
          )}
          {isAuthenticated ? (
            <button onClick={handleLogout} className="text-sm font-medium text-red-600 dark:text-red-400 no-underline text-left cursor-pointer flex items-center gap-2">
              <LogOut className="w-4 h-4" />
              {t('nav_logout') || 'Logout'}
            </button>
          ) : (
            <Link to="/login" onClick={closeMobile} className="text-sm font-medium text-gray-600 dark:text-gray-400 no-underline">{t('nav_login')}</Link>
          )}
        </div>
      )}
    </nav>
  );
};

export default Navbar;
