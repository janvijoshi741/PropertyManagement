import axios from 'axios';

const apiClient = axios.create({
  baseURL: '/api',
  headers: { 'Content-Type': 'application/json' },
});

// Request interceptor — inject Bearer token
apiClient.interceptors.request.use((config) => {
  const token = localStorage.getItem('accessToken');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Response interceptor — handle 401
apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (axios.isAxiosError(error) && error.response?.status === 401) {
      // Don't redirect for login endpoints — let the form show its own error
      const url = error.config?.url || '';
      if (!url.includes('/auth/')) {
        localStorage.removeItem('accessToken');
        localStorage.removeItem('user');
        // Redirect to the correct login page based on current route
        const isAdminRoute = window.location.pathname.startsWith('/admin');
        window.location.href = isAdminRoute ? '/admin/login' : '/login';
      }
    }
    return Promise.reject(error);
  }
);

export default apiClient;
