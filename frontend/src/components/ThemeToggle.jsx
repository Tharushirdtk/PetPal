import { Sun, Moon } from 'lucide-react';
import { useTheme } from '../context/ThemeContext';
import { useAuth } from '../context/AuthContext';
import { updateTheme } from '../api/auth';

export default function ThemeToggle() {
  const { theme, toggleTheme } = useTheme();
  const { isAuthenticated, setUser } = useAuth();

  const handleToggle = () => {
    const newTheme = theme === 'light' ? 'dark' : 'light';
    toggleTheme(); // Instant local update

    // Persist to DB if logged in (fire-and-forget)
    if (isAuthenticated) {
      const themeValue = newTheme === 'dark' ? 1 : 0;
      updateTheme(themeValue)
        .then((res) => {
          if (res.data?.user) {
            setUser(res.data.user);
            localStorage.setItem('petpal_user', JSON.stringify(res.data.user));
          }
        })
        .catch(() => {
          // Silent fail — localStorage still has the preference
        });
    }
  };

  return (
    <button
      onClick={handleToggle}
      aria-label={`Switch to ${theme === 'light' ? 'dark' : 'light'} mode`}
      className="relative inline-flex items-center gap-2 px-4 py-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 transition-all duration-300 cursor-pointer"
    >
      {/* Light mode indicator */}
      <Sun
        className={`w-5 h-5 transition-all duration-300 ${
          theme === 'light'
            ? 'text-yellow-500 opacity-100'
            : 'text-gray-400 dark:text-gray-600 opacity-50'
        }`}
      />

      {/* Toggle switch */}
      <div
        className={`w-8 h-5 rounded-full transition-all duration-300 ${
          theme === 'dark'
            ? 'bg-[#7C3AED] dark:bg-[#A78BFA]'
            : 'bg-gray-200 dark:bg-gray-600'
        }`}
      >
        <div
          className={`w-4 h-4 rounded-full bg-white shadow-md transition-transform duration-300 flex items-center justify-center ${
            theme === 'dark' ? 'translate-x-4' : 'translate-x-0.5'
          }`}
        ></div>
      </div>

      {/* Dark mode indicator */}
      <Moon
        className={`w-5 h-5 transition-all duration-300 ${
          theme === 'dark'
            ? 'text-purple-400 opacity-100'
            : 'text-gray-400 dark:text-gray-600 opacity-50'
        }`}
      />
    </button>
  );
}
