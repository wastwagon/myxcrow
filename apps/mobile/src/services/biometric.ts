import * as LocalAuthentication from 'expo-local-authentication';
import { Platform } from 'react-native';

export interface BiometricAuthResult {
  success: boolean;
  error?: string;
}

export async function checkBiometricAvailability(): Promise<{
  available: boolean;
  type: 'fingerprint' | 'facial' | 'iris' | 'none';
}> {
  const compatible = await LocalAuthentication.hasHardwareAsync();
  if (!compatible) {
    return { available: false, type: 'none' };
  }

  const enrolled = await LocalAuthentication.isEnrolledAsync();
  if (!enrolled) {
    return { available: false, type: 'none' };
  }

  const types = await LocalAuthentication.supportedAuthenticationTypesAsync();
  
  let type: 'fingerprint' | 'facial' | 'iris' = 'fingerprint';
  if (types.includes(LocalAuthentication.AuthenticationType.FACIAL_RECOGNITION)) {
    type = 'facial';
  } else if (types.includes(LocalAuthentication.AuthenticationType.IRIS)) {
    type = 'iris';
  }

  return { available: true, type };
}

export async function authenticateWithBiometrics(
  reason: string = 'Authenticate to access your account'
): Promise<BiometricAuthResult> {
  try {
    const result = await LocalAuthentication.authenticateAsync({
      promptMessage: reason,
      cancelLabel: 'Cancel',
      disableDeviceFallback: false,
      fallbackLabel: 'Use Passcode',
    });

    if (result.success) {
      return { success: true };
    } else {
      return {
        success: false,
        error: result.error || 'Authentication failed',
      };
    }
  } catch (error: any) {
    return {
      success: false,
      error: error.message || 'Biometric authentication error',
    };
  }
}

export async function isBiometricEnabled(): Promise<boolean> {
  try {
    const AsyncStorage = (await import('@react-native-async-storage/async-storage')).default;
    const enabled = await AsyncStorage.getItem('biometricEnabled');
    return enabled === 'true';
  } catch {
    return false;
  }
}

export async function setBiometricEnabled(enabled: boolean): Promise<void> {
  const AsyncStorage = (await import('@react-native-async-storage/async-storage')).default;
  await AsyncStorage.setItem('biometricEnabled', String(enabled));
}
