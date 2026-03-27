import axios from 'axios';

const BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api';

const client = axios.create({
  baseURL: BASE_URL,
  timeout: 30000,
  headers: { 'Content-Type': 'application/json' },
});

// Request interceptor — attach JWT token
client.interceptors.request.use((config) => {
  const token = localStorage.getItem('petpal_token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// Response interceptor — unwrap response data, handle 401
client.interceptors.response.use(
  (response) => response.data,
  (error) => {
    if (error.response?.status === 401) {
      const token = localStorage.getItem('petpal_token');
      // Only redirect to /login when a stored token is invalid/expired.
      // Don't redirect for auth endpoints (login/register) — let the page show the error.
      // Don't redirect for anonymous users (no token) hitting protected endpoints.
      if (token) {
        const url = error.config?.url || '';
        const isAuthEndpoint = url.includes('/auth/login') || url.includes('/auth/register');
        if (!isAuthEndpoint) {
          localStorage.removeItem('petpal_token');
          localStorage.removeItem('petpal_user');
          window.location.href = '/login';
        }
      }
    }
    return Promise.reject(error.response?.data || { error: error.message });
  }
);

export default client;
