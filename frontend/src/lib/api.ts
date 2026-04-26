import axios from 'axios';

export const API_BASE_URL = (import.meta.env.VITE_API_URL || 'http://localhost:8000/api').replace(/\/+$/, '');

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

let isRefreshing = false;
let queuedRequests: Array<(token: string | null) => void> = [];
let logoutCallback: (() => void) | null = null;

export const setLogoutCallback = (callback: () => void) => {
  logoutCallback = callback;
};

const handleLogout = () => {
  localStorage.removeItem('token');
  localStorage.removeItem('refresh_token');
  if (logoutCallback) {
    logoutCallback();
  }
};

const flushQueuedRequests = (token: string | null) => {
  queuedRequests.forEach((callback) => callback(token));
  queuedRequests = [];
};

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const status = error?.response?.status;
    const isAuthEndpoint = error?.config?.url?.includes('/auth/login/');
    const isRefreshEndpoint = error?.config?.url?.includes('/auth/refresh/');
    const originalRequest = error?.config;
    if (!originalRequest) {
      return Promise.reject(error);
    }

    if (status === 401 && !isAuthEndpoint && !isRefreshEndpoint && !originalRequest?._retry) {
      const refreshToken = localStorage.getItem('refresh_token');
      if (!refreshToken) {
        handleLogout();
        return Promise.reject(error);
      }

      if (isRefreshing) {
        return new Promise((resolve, reject) => {
          queuedRequests.push((newToken) => {
            if (!newToken) {
              reject(error);
              return;
            }
            originalRequest.headers.Authorization = `Bearer ${newToken}`;
            resolve(api(originalRequest));
          });
        });
      }

      originalRequest._retry = true;
      isRefreshing = true;

      try {
        const refreshResponse = await axios.post(`${API_BASE_URL}/auth/refresh/`, {
          refresh: refreshToken,
        });
        const newAccessToken = refreshResponse.data?.access;
        const newRefreshToken = refreshResponse.data?.refresh;
        
        localStorage.setItem('token', newAccessToken);
        if (newRefreshToken) {
          localStorage.setItem('refresh_token', newRefreshToken);
        }
        
        api.defaults.headers.common.Authorization = `Bearer ${newAccessToken}`;
        flushQueuedRequests(newAccessToken);
        originalRequest.headers.Authorization = `Bearer ${newAccessToken}`;
        return api(originalRequest);
      } catch (refreshError) {
        flushQueuedRequests(null);
        handleLogout();
        return Promise.reject(refreshError);
      } finally {
        isRefreshing = false;
      }
    }

    if (status === 401 && !isAuthEndpoint) {
      handleLogout();
    }
    return Promise.reject(error);
  }
);

export default api;
