import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { getMe } from '../api/auth';
import { useTheme } from './ThemeContext';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const { setTheme } = useTheme();
  const [user, setUser] = useState(() => {
    const stored = localStorage.getItem('petpal_user');
    try { return stored ? JSON.parse(stored) : null; } catch { return null; }
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem('petpal_token');
    if (token) {
      getMe()
        .then((res) => {
          const u = res.data.user;
          setUser(u);
          localStorage.setItem('petpal_user', JSON.stringify(u));

          // Sync theme preference from user data (database wins over localStorage)
          if (u.theme !== undefined) {
            const themeName = u.theme === 1 ? 'dark' : 'light';
            setTheme(themeName);
          }
        })
        .catch(() => {
          localStorage.removeItem('petpal_token');
          localStorage.removeItem('petpal_user');
          setUser(null);
        })
        .finally(() => setLoading(false));
    } else {
      setLoading(false);
    }
  }, [setTheme]);

  const loginUser = useCallback((userData, token) => {
    localStorage.setItem('petpal_token', token);
    localStorage.setItem('petpal_user', JSON.stringify(userData));
    setUser(userData);

    // Sync theme from login user data
    if (userData.theme !== undefined) {
      const themeName = userData.theme === 1 ? 'dark' : 'light';
      setTheme(themeName);
    }
  }, [setTheme]);

  const logoutUser = useCallback(() => {
    localStorage.removeItem('petpal_token');
    localStorage.removeItem('petpal_user');
    setUser(null);
  }, []);

  const isAuthenticated = !!user;

  return (
    <AuthContext.Provider value={{ user, loading, isAuthenticated, loginUser, logoutUser, setUser }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
