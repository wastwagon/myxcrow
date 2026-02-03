import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, Switch, TouchableOpacity, ActivityIndicator } from 'react-native';
import { useRouter } from 'expo-router';
import { checkBiometricAvailability, isBiometricEnabled, setBiometricEnabled } from '../../../src/services/biometric';
import Toast from 'react-native-toast-message';

export default function SettingsScreen() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [biometricAvailable, setBiometricAvailable] = useState(false);
  const [biometricType, setBiometricType] = useState<'fingerprint' | 'facial' | 'iris' | 'none'>('none');
  const [biometricOn, setBiometricOn] = useState(false);

  useEffect(() => {
    (async () => {
      const avail = await checkBiometricAvailability();
      setBiometricAvailable(avail.available);
      setBiometricType(avail.type);
      const enabled = await isBiometricEnabled();
      setBiometricOn(enabled);
      setLoading(false);
    })();
  }, []);

  const toggleBiometric = async (value: boolean) => {
    setBiometricOn(value);
    try {
      await setBiometricEnabled(value);
      Toast.show({
        type: 'success',
        text1: 'Saved',
        text2: value ? 'Biometric login enabled' : 'Biometric login disabled',
      });
    } catch (e: any) {
      Toast.show({ type: 'error', text1: 'Failed', text2: e?.message || 'Could not save setting' });
      setBiometricOn(!value);
    }
  };

  if (loading) {
    return (
      <View style={styles.loading}>
        <ActivityIndicator />
        <Text style={{ marginTop: 8 }}>Loading settings...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Text style={styles.back}>← Back</Text>
        </TouchableOpacity>
        <Text style={styles.title}>Settings</Text>
      </View>

      <View style={styles.card}>
        <View style={styles.row}>
          <View style={{ flex: 1 }}>
            <Text style={styles.label}>Biometric login</Text>
            <Text style={styles.hint}>
              {biometricAvailable
                ? `Use ${biometricType === 'facial' ? 'Face ID' : biometricType} to sign in faster.`
                : 'Biometric authentication not available on this device.'}
            </Text>
          </View>
          <Switch
            value={biometricOn}
            onValueChange={toggleBiometric}
            disabled={!biometricAvailable}
          />
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f5f5f5' },
  header: { padding: 20, paddingTop: 60, backgroundColor: '#fff', borderBottomWidth: 1, borderBottomColor: '#eee' },
  back: { color: '#374151', fontSize: 16, marginBottom: 8 },
  title: { fontSize: 22, fontWeight: 'bold', color: '#111827' },
  card: { margin: 16, backgroundColor: '#fff', borderRadius: 12, padding: 16, elevation: 2 },
  row: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  label: { fontSize: 16, fontWeight: '700', color: '#111827' },
  hint: { marginTop: 6, color: '#6b7280', fontSize: 12 },
  loading: { flex: 1, justifyContent: 'center', alignItems: 'center' },
});

