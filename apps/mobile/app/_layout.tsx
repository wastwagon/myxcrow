import { Stack } from 'expo-router';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { AuthProvider } from '../src/contexts/AuthContext';
import Toast from 'react-native-toast-message';
import { StatusBar } from 'expo-status-bar';
import { useEffect } from 'react';
import { registerForPushNotificationsAsync } from '../src/services/notifications';
import { initializeIntercom } from '../src/services/intercom';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      staleTime: 5 * 60 * 1000, // 5 minutes
    },
  },
});

export default function RootLayout() {
  useEffect(() => {
    // Initialize Intercom
    initializeIntercom();
    
    // Register for push notifications on app start
    registerForPushNotificationsAsync().then((token) => {
      if (token) {
        console.log('Push notification token:', token);
        // Token will be sent to server after user logs in
      }
    });
  }, []);

  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <StatusBar style="auto" />
        <Stack
          screenOptions={{
            headerShown: false,
          }}
        >
          <Stack.Screen name="(auth)" />
          <Stack.Screen name="(tabs)" />
        </Stack>
        <Toast />
      </AuthProvider>
    </QueryClientProvider>
  );
}
