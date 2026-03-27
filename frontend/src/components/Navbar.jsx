import { Link, useLocation, useNavigate } from 'react-router-dom';
import { Search, Bell, Menu, X, LogOut } from 'lucide-react';
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

  const isActive = (path) => location.pathname === path;

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

  if (variant === 'landing') {
    return (
      <nav className="bg-white/80 backdrop-blur-md border-b border-[#E5E7EB] sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-6 flex items-center justify-between h-16">
          <Link to="/" className="flex items-center gap-2 no-underline">
            <PawIcon />
            <span className="font-display font-bold text-lg text-gray-900">PetPal</span>
          </Link>
          <div className="hidden md:flex items-center gap-8">
            <Link to="/" className={`text-sm font-medium no-underline ${isActive('/') ? 'text-[#7C3AED]' : 'text-gray-600 hover:text-[#7C3AED]'} transition-colors`}>{t('nav_aboutus')}</Link>
            <Link to="/chat" className="text-sm font-medium text-gray-600 hover:text-[#7C3AED] transition-colors no-underline">{t('nav_diagnosis')}</Link>
            <Link to="/" className="text-sm font-medium text-gray-600 hover:text-[#7C3AED] transition-colors no-underline">{t('nav_contact')}</Link>
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
            <Link to="/" className="text-sm font-medium text-gray-600 no-underline">{t('nav_aboutus')}</Link>
            <Link to="/chat" className="text-sm font-medium text-gray-600 no-underline">{t('nav_diagnosis')}</Link>
            <Link to="/" className="text-sm font-medium text-gray-600 no-underline">{t('nav_contact')}</Link>
            {isAuthenticated ? (
              <button onClick={handleLogout} className="text-sm font-medium text-red-600 no-underline text-left cursor-pointer flex items-center gap-2">
                <LogOut className="w-4 h-4" />
                {t('nav_logout') || 'Logout'}
              </button>
            ) : (
              <Link to="/login" className="text-sm font-medium text-gray-600 no-underline">{t('nav_login')}</Link>
            )}
          </div>
        )}
      </nav>
    );
  }

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

  if (variant === 'report') {
    return (
      <nav className="bg-white/80 backdrop-blur-md border-b border-[#E5E7EB] sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-6 flex items-center justify-between h-16">
          <Link to="/" className="flex items-center gap-2 no-underline">
            <PawIcon />
            <span className="font-display font-bold text-lg text-gray-900">PetPal</span>
          </Link>
          <div className="hidden md:flex items-center gap-8">
            <Link to="/" className="text-sm font-medium text-gray-600 hover:text-[#7C3AED] transition-colors no-underline">Home</Link>
            <Link to="/chat" className="text-sm font-medium text-gray-600 hover:text-[#7C3AED] transition-colors no-underline">{t('nav_diagnosis')}</Link>
            <Link to="/dashboard" className="text-sm font-medium text-gray-600 hover:text-[#7C3AED] transition-colors no-underline">My Account</Link>
          </div>
          <div className="flex items-center gap-3">
            <LangToggle />
            {isAuthenticated ? (
              <UserMenu />
            ) : (
              <Link to="/login" className="text-sm font-medium text-gray-600 hover:text-[#7C3AED] transition-colors no-underline">{t('nav_login')}</Link>
            )}
          </div>
        </div>
      </nav>
    );
  }

  // Default variant for authenticated pages
  return (
    <nav className="bg-white border-b border-[#E5E7EB] sticky top-0 z-40">
      <div className="max-w-7xl mx-auto px-6 flex items-center justify-between h-16">
        <Link to="/dashboard" className="flex items-center gap-2 no-underline">
          <PawIcon />
          <span className="font-display font-bold text-lg text-gray-900">PetPal</span>
        </Link>
        <div className="hidden md:flex items-center gap-8">
          <Link to="/dashboard" className={`text-sm font-medium no-underline ${isActive('/dashboard') ? 'text-[#7C3AED]' : 'text-gray-600 hover:text-[#7C3AED]'} transition-colors`}>{t('nav_my_pets')}</Link>
          <Link to="/chat" className={`text-sm font-medium no-underline ${isActive('/chat') ? 'text-[#7C3AED]' : 'text-gray-600 hover:text-[#7C3AED]'} transition-colors`}>{t('nav_diagnosis')}</Link>
          <Link to="/" className={`text-sm font-medium no-underline ${isActive('/vets') ? 'text-[#7C3AED]' : 'text-gray-600 hover:text-[#7C3AED]'} transition-colors`}>{t('nav_vets')}</Link>
          <Link to="/" className={`text-sm font-medium no-underline ${isActive('/library') ? 'text-[#7C3AED]' : 'text-gray-600 hover:text-[#7C3AED]'} transition-colors`}>{t('nav_library')}</Link>
        </div>
        <div className="flex items-center gap-3">
          <LangToggle />
          <button className="p-2 text-gray-400 hover:text-[#7C3AED] transition-colors cursor-pointer">
            <Search className="w-5 h-5" />
          </button>
          <button className="p-2 text-gray-400 hover:text-[#7C3AED] transition-colors relative cursor-pointer">
            <Bell className="w-5 h-5" />
            <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-[#EF4444] rounded-full" />
          </button>
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
          <Link to="/dashboard" className="text-sm font-medium text-gray-600 no-underline">{t('nav_my_pets')}</Link>
          <Link to="/chat" className="text-sm font-medium text-gray-600 no-underline">{t('nav_diagnosis')}</Link>
          <Link to="/" className="text-sm font-medium text-gray-600 no-underline">{t('nav_vets')}</Link>
          <Link to="/" className="text-sm font-medium text-gray-600 no-underline">{t('nav_library')}</Link>
          {isAuthenticated && (
            <button onClick={handleLogout} className="text-sm font-medium text-red-600 no-underline text-left cursor-pointer flex items-center gap-2">
              <LogOut className="w-4 h-4" />
              {t('nav_logout') || 'Logout'}
            </button>
          )}
        </div>
      )}
    </nav>
  );
};

export default Navbar;
