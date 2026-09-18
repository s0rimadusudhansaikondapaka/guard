import axios from 'axios';

const getStoredBaseUrl = () => {
  return localStorage.getItem('api_base_url') || import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api';
};

const api = axios.create({
  baseURL: getStoredBaseUrl(),
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('guard_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response && (error.response.status === 401 || error.response.status === 403)) {
      localStorage.removeItem('guard_token');
      localStorage.removeItem('guard_user');
      if (window.location.pathname !== '/login') {
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  }
);

export const getBaseUrl = () => {
  return localStorage.getItem('api_base_url') || import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api';
};

export const setBaseUrl = (url) => {
  if (url) {
    localStorage.setItem('api_base_url', url);
    api.defaults.baseURL = url;
  }
};

export default api;
