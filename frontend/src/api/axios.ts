import axios from 'axios';

const baseURL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000/api';

const api = axios.create({
  baseURL,
  headers: {
    'Content-Type': 'application/json',
  },
});

api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    console.log('[Axios Request]', config.method?.toUpperCase(), config.url, config.headers.Authorization ? 'with token' : 'without token');
    return config;
  },
  (error) => Promise.reject(error)
);

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;
    console.error('[Axios Response Error]', error.response?.status, originalRequest.url);

    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;
      const refreshToken = localStorage.getItem('refresh');
      
      if (refreshToken) {
        console.log('[Axios Interceptor] 401 Error. Attempting to refresh token...');
        try {
          const { data } = await axios.post(`${baseURL}/auth/token/refresh/`, {
            refresh: refreshToken,
          });
          console.log('[Axios Interceptor] Token refreshed successfully.');
          localStorage.setItem('token', data.access);
          api.defaults.headers.common.Authorization = `Bearer ${data.access}`;
          originalRequest.headers.Authorization = `Bearer ${data.access}`;
          return api(originalRequest);
        } catch (refreshError: any) {
          console.error('[Axios Interceptor] Token refresh failed:', refreshError.response?.data);
          localStorage.removeItem('token');
          localStorage.removeItem('refresh');
          window.location.href = '/login';
          return Promise.reject(refreshError);
        }
      } else {
        console.log('[Axios Interceptor] No refresh token found. Redirecting to login.');
        localStorage.removeItem('token');
        localStorage.removeItem('refresh');
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  }
);

export default api;