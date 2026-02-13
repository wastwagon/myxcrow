import axios, { AxiosInstance, AxiosError } from 'axios';
import { setAuthTokens } from './auth';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:4000/api';

const REFRESH_TIMEOUT_MS = 10000; // 10s - avoid indefinite hang on refresh

export const apiClient: AxiosInstance = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 30000,
});

// Request interceptor: auth token + allow FormData (multipart) to set its own Content-Type
apiClient.interceptors.request.use(
  (config) => {
    if (typeof config.data !== 'undefined' && config.data instanceof FormData) {
      delete config.headers['Content-Type']; // so axios sets multipart/form-data with boundary
    }
    if (typeof window !== 'undefined') {
      const token = localStorage.getItem('accessToken');
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor for error handling and token refresh
let isRefreshing = false;
let failedQueue: Array<{
  resolve: (value?: any) => void;
  reject: (error?: any) => void;
}> = [];

const processQueue = (error: any, token: string | null = null) => {
  failedQueue.forEach((prom) => {
    if (error) {
      prom.reject(error);
    } else {
      prom.resolve(token);
    }
  });
  failedQueue = [];
};

apiClient.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const originalRequest = error.config as any;

    // Log error details for debugging
    if (typeof window !== 'undefined' && process.env.NODE_ENV === 'development') {
      console.error('API Error:', {
        message: error.message,
        status: error.response?.status,
        statusText: error.response?.statusText,
        data: error.response?.data,
        config: {
          url: originalRequest?.url,
          method: originalRequest?.method,
          baseURL: originalRequest?.baseURL,
        },
      });
    }

    // Handle 401 Unauthorized
    if (error.response?.status === 401 && originalRequest && !originalRequest._retry) {
      if (isRefreshing) {
        // If already refreshing, queue this request
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject });
        })
          .then((token) => {
            originalRequest.headers.Authorization = `Bearer ${token}`;
            return apiClient(originalRequest);
          })
          .catch((err) => {
            return Promise.reject(err);
          });
      }

      originalRequest._retry = true;
      isRefreshing = true;

      const refreshToken = typeof window !== 'undefined' ? localStorage.getItem('refreshToken') : null;

      if (!refreshToken) {
        // No refresh token, clear auth and redirect
        if (typeof window !== 'undefined') {
          localStorage.removeItem('accessToken');
          localStorage.removeItem('refreshToken');
          localStorage.removeItem('user');
          // Only redirect if not already on login page
          if (window.location.pathname !== '/login') {
            window.location.href = '/login';
          }
        }
        processQueue(error, null);
        isRefreshing = false;
        return Promise.reject(error);
      }

      try {
        const response = await axios.post(
          `${API_BASE_URL}/auth/refresh`,
          { refreshToken },
          {
            headers: { 'Content-Type': 'application/json' },
            timeout: REFRESH_TIMEOUT_MS,
          },
        );

        const { accessToken, refreshToken: newRefreshToken } = response.data;

        // Update tokens in localStorage
        if (typeof window !== 'undefined') {
          setAuthTokens(accessToken, newRefreshToken || refreshToken);
        }

        // Update the original request with new token
        originalRequest.headers.Authorization = `Bearer ${accessToken}`;

        // Process queued requests
        processQueue(null, accessToken);
        isRefreshing = false;

        // Retry the original request
        return apiClient(originalRequest);
      } catch (refreshError: any) {
        processQueue(refreshError, null);
        isRefreshing = false;
        if (typeof window !== 'undefined') {
          localStorage.removeItem('accessToken');
          localStorage.removeItem('refreshToken');
          localStorage.removeItem('user');
          if (window.location.pathname !== '/login') {
            window.location.href = '/login';
          }
        }
        if (refreshError?.code === 'ECONNABORTED' || refreshError?.message?.includes('timeout')) {
          return Promise.reject(new Error('Session expired. Please sign in again.'));
        }
        return Promise.reject(refreshError);
      }
    }

    // Handle 403 Phone Required - redirect to profile to add phone
    if (error.response?.status === 403 && typeof window !== 'undefined') {
      const msg = (error.response?.data as any)?.message || '';
      if (msg.toLowerCase().includes('phone number required') || msg.toLowerCase().includes('add your ghana phone')) {
        if (window.location.pathname !== '/profile') {
          window.location.href = '/profile?phone_required=1';
        }
      }
    }

    return Promise.reject(error);
  }
);

export default apiClient;

