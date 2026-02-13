import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { User, getUser, setUser, isAuthenticated, clearAuth } from '../lib/auth';
import apiClient from '../lib/api-client';

interface AuthContextType {
  user: User | null;
  loading: boolean;
  authenticated: boolean;
  login: (identifier: string, password: string) => Promise<void>;
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
  code: string;
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

  const login = async (identifier: string, password: string) => {
    try {
      const response = await apiClient.post('/auth/login', { identifier, password });
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
      const response = await apiClient.post('/auth/register', {
        email: data.email,
        code: data.code,
        password: data.password,
        firstName: data.firstName,
        lastName: data.lastName,
        phone: data.phone,
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
