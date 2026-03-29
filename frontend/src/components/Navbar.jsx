import { Link, useLocation, useNavigate } from 'react-router-dom';
import { Menu, X, LogOut } from 'lucide-react';
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
      active ? 'text-[#7C3AED]' : 'text-gray-600 hover:text-[#7C3AED]'
    }`;

  // User avatar + dropdown (reusable across variants)
  const UserMenu = () => (
    <div className="relative">
      <div
        className="w-8 h-8 rounded-full bg-[#7C3AED] text-white flex items-center justify-center text-sm font-semibold cursor-pointer"
        onClick={() => setDropdownOpen(!dropdownOpen)}
      >
        {userInitial}
      </div>
      {dropdownOpen && (
        <div className="absolute right-0 mt-2 w-48 bg-white rounded-xl border border-[#E5E7EB] shadow-lg py-2 z-50">
          <div className="px-4 py-2 border-b border-[#E5E7EB]">
            <p className="text-sm font-semibold text-gray-900 truncate">{user?.name || 'User'}</p>
            <p className="text-xs text-gray-400 truncate">{user?.email || ''}</p>
          </div>
          <button
            onClick={handleLogout}
            className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50 transition-colors cursor-pointer flex items-center gap-2"
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
      <nav className="bg-white/80 backdrop-blur-md border-b border-[#E5E7EB] sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-6 flex items-center justify-between h-16">
          <Link to="/" className="flex items-center gap-2 no-underline">
            <PawIcon />
            <span className="font-display font-bold text-lg text-gray-900">PetPal</span>
          </Link>
          <div className="hidden md:flex items-center gap-8">
            <Link to="/" className={linkClass(isActive('/'))}>{t('nav_home')}</Link>
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
                <Link to="/login" className="text-sm font-medium text-gray-600 hover:text-[#7C3AED] transition-colors no-underline hidden sm:block">{t('nav_login')}</Link>
                <Link to="/register" className="bg-[#7C3AED] text-white rounded-full px-5 py-2 text-sm font-semibold hover:bg-[#6D28D9] transition-all shadow-md hover:shadow-lg hover:-translate-y-0.5 no-underline">{t('nav_register')}</Link>
              </>
            )}
            <button onClick={() => setMobileOpen(!mobileOpen)} className="md:hidden p-2 cursor-pointer">
              {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>
        {mobileOpen && (
          <div className="md:hidden border-t border-[#E5E7EB] bg-white px-6 py-4 flex flex-col gap-3">
            <Link to="/" onClick={closeMobile} className="text-sm font-medium text-gray-600 no-underline">{t('nav_home')}</Link>
            {isAuthenticated ? (
              <Link to="/dashboard" onClick={closeMobile} className="text-sm font-medium text-gray-600 no-underline">{t('nav_dashboard')}</Link>
            ) : (
              <Link to="/diagnosis" onClick={closeMobile} className="text-sm font-medium text-gray-600 no-underline">{t('nav_diagnosis')}</Link>
            )}
            <a href="#contact" onClick={closeMobile} className="text-sm font-medium text-gray-600 no-underline">{t('nav_contact')}</a>
            {isAuthenticated ? (
              <button onClick={handleLogout} className="text-sm font-medium text-red-600 no-underline text-left cursor-pointer flex items-center gap-2">
                <LogOut className="w-4 h-4" />
                {t('nav_logout') || 'Logout'}
              </button>
            ) : (
              <Link to="/login" onClick={closeMobile} className="text-sm font-medium text-gray-600 no-underline">{t('nav_login')}</Link>
            )}
          </div>
        )}
      </nav>
    );
  }

  /* ═══════ ADMIN VARIANT ═══════ */
  if (variant === 'admin') {
    return (
      <nav className="bg-white border-b border-[#E5E7EB] sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-6 flex items-center justify-between h-16">
          <Link to="/admin" className="flex items-center gap-2 no-underline">
            <PawIcon />
            <span className="font-display font-bold text-lg text-gray-900">PetPal</span>
            <span className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full font-medium">Admin</span>
          </Link>
          <div className="flex items-center gap-3">
            <LangToggle />
            {isAuthenticated ? (
              <UserMenu />
            ) : (
              <div className="w-8 h-8 rounded-full bg-[#7C3AED] text-white flex items-center justify-center text-sm font-semibold">A</div>
            )}
          </div>
        </div>
      </nav>
    );
  }

  /* ═══════ DEFAULT VARIANT — all app pages ═══════ */
  return (
    <nav className="bg-white border-b border-[#E5E7EB] sticky top-0 z-40">
      <div className="max-w-7xl mx-auto px-6 flex items-center justify-between h-16">
        <Link to={isAuthenticated ? '/dashboard' : '/'} className="flex items-center gap-2 no-underline">
          <PawIcon />
          <span className="font-display font-bold text-lg text-gray-900">PetPal</span>
        </Link>
        <div className="hidden md:flex items-center gap-8">
          <Link to="/" className={linkClass(isActive('/'))}>{t('nav_home')}</Link>
          <Link to="/dashboard" className={linkClass(isActive('/dashboard'))}>{t('nav_dashboard')}</Link>
          <Link to="/records" className={linkClass(isActive('/records'))}>{t('nav_records')}</Link>
        </div>
        <div className="flex items-center gap-3">
          <LangToggle />
          {isAuthenticated ? (
            <UserMenu />
          ) : (
            <Link to="/login" className="text-sm font-medium text-gray-600 hover:text-[#7C3AED] transition-colors no-underline">{t('nav_login')}</Link>
          )}
          <button onClick={() => setMobileOpen(!mobileOpen)} className="md:hidden p-2 cursor-pointer">
            {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </div>
      {mobileOpen && (
        <div className="md:hidden border-t border-[#E5E7EB] bg-white px-6 py-4 flex flex-col gap-3">
          <Link to="/" onClick={closeMobile} className="text-sm font-medium text-gray-600 no-underline">{t('nav_home')}</Link>
          <Link to="/dashboard" onClick={closeMobile} className="text-sm font-medium text-gray-600 no-underline">{t('nav_dashboard')}</Link>
          <Link to="/records" onClick={closeMobile} className="text-sm font-medium text-gray-600 no-underline">{t('nav_records')}</Link>
          {isAuthenticated ? (
            <button onClick={handleLogout} className="text-sm font-medium text-red-600 no-underline text-left cursor-pointer flex items-center gap-2">
              <LogOut className="w-4 h-4" />
              {t('nav_logout') || 'Logout'}
            </button>
          ) : (
            <Link to="/login" onClick={closeMobile} className="text-sm font-medium text-gray-600 no-underline">{t('nav_login')}</Link>
          )}
        </div>
      )}
    </nav>
  );
};

export default Navbar;
