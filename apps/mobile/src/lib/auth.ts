import AsyncStorage from '@react-native-async-storage/async-storage';
import * as SecureStore from 'expo-secure-store';

export interface User {
  id: string;
  email?: string;
  firstName?: string;
  lastName?: string;
  phone?: string;
  roles: string[];
  kycStatus: string;
  walletBalance?: number;
}

export interface AuthResponse {
  user: User;
  accessToken: string;
  refreshToken: string;
  faceMatchScore?: number;
}

export async function getAccessToken(): Promise<string | null> {
  try {
    return await SecureStore.getItemAsync('accessToken');
  } catch (error) {
    console.error('Error getting access token:', error);
    return null;
  }
}

export async function setAuthTokens(accessToken: string, refreshToken: string): Promise<void> {
  try {
    await SecureStore.setItemAsync('accessToken', accessToken);
    await SecureStore.setItemAsync('refreshToken', refreshToken);
  } catch (error) {
    console.error('Error setting auth tokens:', error);
  }
}

export async function clearAuth(): Promise<void> {
  try {
    await SecureStore.deleteItemAsync('accessToken');
    await SecureStore.deleteItemAsync('refreshToken');
    await AsyncStorage.removeItem('user');
  } catch (error) {
    console.error('Error clearing auth:', error);
  }
}

export async function getUser(): Promise<User | null> {
  try {
    const userStr = await AsyncStorage.getItem('user');
    if (!userStr) return null;
    return JSON.parse(userStr);
  } catch (error) {
    console.error('Error getting user:', error);
    return null;
  }
}

export async function setUser(user: User): Promise<void> {
  try {
    await AsyncStorage.setItem('user', JSON.stringify(user));
  } catch (error) {
    console.error('Error setting user:', error);
  }
}

export async function isAuthenticated(): Promise<boolean> {
  const token = await getAccessToken();
  return !!token;
}

export async function isAdmin(): Promise<boolean> {
  const user = await getUser();
  return user?.roles?.includes('ADMIN') ?? false;
}
