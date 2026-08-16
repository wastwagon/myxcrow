import axios, { AxiosInstance, AxiosError } from 'axios';
import { clearAuth } from './auth';
import { getApiBaseUrl } from './api-base';

const API_BASE_URL = getApiBaseUrl();

const REFRESH_TIMEOUT_MS = 10000;

export const apiClient: AxiosInstance = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 30000,
  withCredentials: true,
});

apiClient.interceptors.request.use(
  (config) => {
    if (typeof config.data !== 'undefined' && config.data instanceof FormData) {
      delete config.headers['Content-Type'];
    }
    return config;
  },
  (error) => Promise.reject(error),
);

let isRefreshing = false;
let failedQueue: Array<{
  resolve: (value?: unknown) => void;
  reject: (error?: unknown) => void;
}> = [];

const processQueue = (error: unknown, token: string | null = null) => {
  failedQueue.forEach((prom) => {
    if (error) {
      prom.reject(error);
    } else {
      prom.resolve(token);
    }
  });
  failedQueue = [];
};

function isAuthRefreshRequest(url?: string) {
  return typeof url === 'string' && /\/auth\/refresh(?:\?|$)/.test(url);
}

function shouldSkipRefresh(url?: string) {
  if (!url) return false;
  return /\/auth\/(login|register|logout|refresh|send-phone-otp)/.test(url);
}

function redirectToLogin() {
  if (typeof window === 'undefined') return;
  clearAuth();
  if (window.location.pathname !== '/login') {
    window.location.href = '/login';
  }
}

apiClient.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const originalRequest = error.config as (typeof error.config & { _retry?: boolean }) | undefined;

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

    if (error.response?.status === 401 && originalRequest && !originalRequest._retry) {
      if (shouldSkipRefresh(originalRequest.url)) {
        if (isAuthRefreshRequest(originalRequest.url)) {
          processQueue(error, null);
          isRefreshing = false;
          redirectToLogin();
        }
        return Promise.reject(error);
      }

      if (isRefreshing) {
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject });
        })
          .then(() => apiClient(originalRequest))
          .catch((err) => Promise.reject(err));
      }

      originalRequest._retry = true;
      isRefreshing = true;

      try {
        await axios.post(
          `${API_BASE_URL}/auth/refresh`,
          {},
          {
            headers: { 'Content-Type': 'application/json' },
            timeout: REFRESH_TIMEOUT_MS,
            withCredentials: true,
          },
        );

        processQueue(null, 'ok');
        isRefreshing = false;
        return apiClient(originalRequest);
      } catch (refreshError: unknown) {
        processQueue(refreshError, null);
        isRefreshing = false;
        redirectToLogin();
        const err = refreshError as { code?: string; message?: string };
        if (err?.code === 'ECONNABORTED' || err?.message?.includes('timeout')) {
          return Promise.reject(new Error('Session expired. Please sign in again.'));
        }
        return Promise.reject(refreshError);
      }
    }

    if (error.response?.status === 403 && typeof window !== 'undefined') {
      const msg = (error.response?.data as { message?: string })?.message || '';
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
