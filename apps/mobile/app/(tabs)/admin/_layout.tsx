import { Stack } from 'expo-router';

export default function AdminLayout() {
  return (
    <Stack
      screenOptions={{
        headerStyle: {
          backgroundColor: '#3b82f6',
        },
        headerTintColor: '#fff',
        headerTitleStyle: {
          fontWeight: 'bold',
        },
      }}
    >
      <Stack.Screen
        name="index"
        options={{
          title: 'Admin Dashboard',
        }}
      />
      <Stack.Screen
        name="users"
        options={{
          title: 'User Management',
        }}
      />
      <Stack.Screen
        name="kyc-review"
        options={{
          title: 'KYC Review',
        }}
      />
      <Stack.Screen
        name="withdrawals"
        options={{
          title: 'Withdrawal Approvals',
        }}
      />
      <Stack.Screen
        name="wallet"
        options={{
          title: 'Wallet Operations',
        }}
      />
      <Stack.Screen
        name="settings"
        options={{
          title: 'Platform Settings',
        }}
      />
      <Stack.Screen
        name="fees"
        options={{
          title: 'Fee Management',
        }}
      />
      <Stack.Screen
        name="reconciliation"
        options={{
          title: 'Reconciliation',
        }}
      />
    </Stack>
  );
}
