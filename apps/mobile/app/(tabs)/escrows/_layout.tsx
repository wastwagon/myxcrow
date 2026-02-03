import { Stack } from 'expo-router';

export default function EscrowsLayout() {
  return (
    <Stack
      screenOptions={{
        headerShown: false,
      }}
    >
      <Stack.Screen name="index" />
      <Stack.Screen name="new" />
      <Stack.Screen name="[id]" />
      <Stack.Screen name="[id]/messages" />
      <Stack.Screen name="[id]/milestones" />
      <Stack.Screen name="[id]/evidence" />
    </Stack>
  );
}
