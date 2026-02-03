import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { User, getUser, setUser, isAuthenticated, clearAuth } from '../lib/auth';
import apiClient from '../lib/api-client';

interface AuthContextType {
  user: User | null;
  loading: boolean;
  authenticated: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (data: RegisterData) => Promise<void>;
  logout: () => Promise<void>;
  refreshUser: () => Promise<void>;
}

interface RegisterData {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  phone: string;
  ghanaCardNumber: string;
  role?: 'BUYER' | 'SELLER';
  cardFront?: any;
  cardBack?: any;
  selfie?: any;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUserState] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [authenticated, setAuthenticated] = useState(false);

  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = async () => {
    try {
      const authenticated = await isAuthenticated();
      if (authenticated) {
        const userData = await getUser();
        setUserState(userData);
        setAuthenticated(true);
      }
    } catch (error) {
      console.error('Error checking auth:', error);
    } finally {
      setLoading(false);
    }
  };

  const login = async (email: string, password: string) => {
    try {
      const response = await apiClient.post('/auth/login', { email, password });
      const { user, accessToken, refreshToken } = response.data;

      await setUser(user);
      const { setAuthTokens } = await import('../lib/auth');
      await setAuthTokens(accessToken, refreshToken);

      setUserState(user);
      setAuthenticated(true);

      // Register push token after login
      try {
        const { getStoredPushToken, sendPushTokenToServer } = await import('../services/notifications');
        const token = await getStoredPushToken();
        if (token) {
          await sendPushTokenToServer(token);
        }
      } catch (error) {
        console.error('Failed to register push token:', error);
      }
    } catch (error: any) {
      throw new Error(error.response?.data?.message || 'Login failed');
    }
  };

  const register = async (data: RegisterData) => {
    try {
      const formData = new FormData();
      formData.append('email', data.email);
      formData.append('password', data.password);
      formData.append('firstName', data.firstName);
      formData.append('lastName', data.lastName);
      formData.append('phone', data.phone);
      formData.append('ghanaCardNumber', data.ghanaCardNumber);
      formData.append('role', data.role || 'BUYER');

      if (data.cardFront) {
        formData.append('files', {
          uri: data.cardFront.uri,
          type: 'image/jpeg',
          name: 'card-front.jpg',
        } as any);
      }
      if (data.cardBack) {
        formData.append('files', {
          uri: data.cardBack.uri,
          type: 'image/jpeg',
          name: 'card-back.jpg',
        } as any);
      }
      if (data.selfie) {
        formData.append('files', {
          uri: data.selfie.uri,
          type: 'image/jpeg',
          name: 'selfie.jpg',
        } as any);
      }

      const response = await apiClient.post('/auth/register', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      const { user, accessToken, refreshToken } = response.data;

      await setUser(user);
      const { setAuthTokens } = await import('../lib/auth');
      await setAuthTokens(accessToken, refreshToken);

      setUserState(user);
      setAuthenticated(true);
    } catch (error: any) {
      throw new Error(error.response?.data?.message || 'Registration failed');
    }
  };

  const logout = async () => {
    try {
      // Unregister Intercom user
      try {
        const { unregisterUser } = await import('../services/intercom');
        await unregisterUser();
      } catch (error) {
        console.error('Failed to unregister Intercom user:', error);
      }

      await clearAuth();
      setUserState(null);
      setAuthenticated(false);
    } catch (error) {
      console.error('Error logging out:', error);
    }
  };

  const refreshUser = async () => {
    try {
      const response = await apiClient.get('/auth/profile');
      const userData = response.data;
      await setUser(userData);
      setUserState(userData);
    } catch (error) {
      console.error('Error refreshing user:', error);
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        authenticated,
        login,
        register,
        logout,
        refreshUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
