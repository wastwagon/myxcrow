import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, KeyboardAvoidingView, Platform, ActivityIndicator, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import apiClient from '../../src/lib/api-client';

export default function ResetPasswordScreen() {
  const router = useRouter();
  const [token, setToken] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const submit = async () => {
    if (!token.trim()) {
      Alert.alert('Token required', 'Paste the reset token from your email link');
      return;
    }
    if (newPassword.length < 8) {
      Alert.alert('Weak password', 'Password must be at least 8 characters');
      return;
    }
    if (newPassword !== confirmPassword) {
      Alert.alert('Mismatch', 'Passwords do not match');
      return;
    }

    try {
      setLoading(true);
      await apiClient.post('/auth/password-reset/confirm', { token: token.trim(), newPassword });
      Alert.alert('Success', 'Password reset successful. You can now login.', [
        { text: 'Go to login', onPress: () => router.replace('/(auth)/login') },
      ]);
    } catch (e: any) {
      Alert.alert('Reset failed', e?.response?.data?.message || e?.message || 'Please try again');
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={styles.container}>
      <View style={styles.content}>
        <TouchableOpacity onPress={() => router.back()}>
          <Text style={styles.back}>← Back</Text>
        </TouchableOpacity>

        <Text style={styles.title}>Reset Password</Text>
        <Text style={styles.subtitle}>Paste the token from your email link, then set a new password.</Text>

        <View style={styles.card}>
          <Text style={styles.label}>Reset token</Text>
          <TextInput
            style={styles.input}
            placeholder="Paste token"
            autoCapitalize="none"
            value={token}
            onChangeText={setToken}
          />

          <Text style={[styles.label, { marginTop: 12 }]}>New password</Text>
          <TextInput
            style={styles.input}
            placeholder="At least 8 characters"
            secureTextEntry
            value={newPassword}
            onChangeText={setNewPassword}
          />

          <Text style={[styles.label, { marginTop: 12 }]}>Confirm password</Text>
          <TextInput
            style={styles.input}
            placeholder="Repeat password"
            secureTextEntry
            value={confirmPassword}
            onChangeText={setConfirmPassword}
          />

          <TouchableOpacity style={[styles.button, loading && styles.buttonDisabled]} onPress={submit} disabled={loading}>
            {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.buttonText}>Reset password</Text>}
          </TouchableOpacity>
        </View>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f5f5f5' },
  content: { flex: 1, justifyContent: 'center', padding: 20 },
  back: { color: '#374151', fontSize: 16, marginBottom: 10 },
  title: { fontSize: 28, fontWeight: 'bold', color: '#111827', marginBottom: 6 },
  subtitle: { color: '#6b7280', marginBottom: 16 },
  card: { backgroundColor: '#fff', borderRadius: 12, padding: 16, elevation: 2 },
  label: { color: '#6b7280', fontSize: 12, fontWeight: '700', marginBottom: 8 },
  input: { backgroundColor: '#f9fafb', borderRadius: 10, padding: 14, borderWidth: 1, borderColor: '#e5e7eb' },
  button: { marginTop: 14, backgroundColor: '#111827', borderRadius: 10, paddingVertical: 14, alignItems: 'center' },
  buttonDisabled: { opacity: 0.6 },
  buttonText: { color: '#fff', fontWeight: '800' },
});

