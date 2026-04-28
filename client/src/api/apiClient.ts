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
      const url = error.config?.url || '';
      // Only redirect if not already on an auth-related path or login page
      const isAuthPath = url.includes('/auth/') || window.location.pathname.includes('/login');
      
      if (!isAuthPath) {
        // Clear local session
        localStorage.removeItem('accessToken');
        localStorage.removeItem('user');
        
        // Redirect to appropriate login page
        const isAdminRoute = window.location.pathname.startsWith('/admin');
        const loginPath = isAdminRoute ? '/admin/login' : '/login';
        
        // Use replace to avoid keeping the expired session in history
        window.location.replace(loginPath);
        
        // Return a pending promise that never resolves to stop further execution 
        // in the calling component while the page redirects
        return new Promise(() => {});
      }
    }
    return Promise.reject(error);
  }
);

export default apiClient;
