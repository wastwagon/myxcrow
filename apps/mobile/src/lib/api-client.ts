import axios, { AxiosInstance, AxiosError } from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as SecureStore from 'expo-secure-store';

const API_BASE_URL = process.env.EXPO_PUBLIC_API_BASE_URL || 'http://localhost:4000/api';
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
  async (config) => {
    if (config.data && typeof config.data.append === 'function') {
      delete config.headers['Content-Type']; // so axios sets multipart/form-data with boundary
    }
    try {
      const token = await SecureStore.getItemAsync('accessToken');
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
    } catch (error) {
      console.error('Error getting token:', error);
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
    if (process.env.NODE_ENV === 'development') {
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

      try {
        const refreshToken = await SecureStore.getItemAsync('refreshToken');

        if (!refreshToken) {
          // No refresh token, clear auth
          await clearAuth();
          processQueue(error, null);
          isRefreshing = false;
          return Promise.reject(error);
        }

        const response = await axios.post(
          `${API_BASE_URL}/auth/refresh`,
          { refreshToken },
          {
            headers: { 'Content-Type': 'application/json' },
            timeout: REFRESH_TIMEOUT_MS,
          },
        );

        const { accessToken, refreshToken: newRefreshToken } = response.data;

        // Update tokens in SecureStore
        await SecureStore.setItemAsync('accessToken', accessToken);
        if (newRefreshToken) {
          await SecureStore.setItemAsync('refreshToken', newRefreshToken);
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
        await clearAuth();
        if (refreshError?.code === 'ECONNABORTED' || refreshError?.message?.includes('timeout')) {
          return Promise.reject(new Error('Session expired. Please sign in again.'));
        }
        return Promise.reject(refreshError);
      }
    }

    // Handle 403 Phone Required - navigate to profile to add phone (parity with web)
    if (error.response?.status === 403) {
      const msg = (error.response?.data as any)?.message || '';
      if (msg.toLowerCase().includes('phone number required') || msg.toLowerCase().includes('add your ghana phone')) {
        import('expo-router').then(({ router }) => {
          router.replace('/(tabs)/profile?phone_required=1');
        }).catch(() => {});
      }
    }

    return Promise.reject(error);
  }
);

// Helper function to clear auth
async function clearAuth() {
  try {
    await SecureStore.deleteItemAsync('accessToken');
    await SecureStore.deleteItemAsync('refreshToken');
    await AsyncStorage.removeItem('user');
  } catch (error) {
    console.error('Error clearing auth:', error);
  }
}

export default apiClient;
