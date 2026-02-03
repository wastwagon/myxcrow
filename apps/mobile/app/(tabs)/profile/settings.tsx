import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, Switch, TouchableOpacity, ActivityIndicator, Linking } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { checkBiometricAvailability, isBiometricEnabled, setBiometricEnabled } from '../../../src/services/biometric';
import { WEB_BASE_URL } from '../../../src/lib/constants';
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

      <View style={styles.card}>
        <Text style={styles.sectionTitle}>Legal</Text>
        <TouchableOpacity style={styles.linkRow} onPress={() => Linking.openURL(`${WEB_BASE_URL}/terms`)}>
          <Ionicons name="document-text-outline" size={22} color="#374151" />
          <Text style={styles.linkLabel}>Terms and Conditions</Text>
          <Ionicons name="open-outline" size={18} color="#9ca3af" />
        </TouchableOpacity>
        <TouchableOpacity style={[styles.linkRow, styles.linkRowLast]} onPress={() => Linking.openURL(`${WEB_BASE_URL}/privacy`)}>
          <Ionicons name="shield-checkmark-outline" size={22} color="#374151" />
          <Text style={styles.linkLabel}>Privacy Policy</Text>
          <Ionicons name="open-outline" size={18} color="#9ca3af" />
        </TouchableOpacity>
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
  sectionTitle: { fontSize: 14, fontWeight: '600', color: '#6b7280', marginBottom: 12, textTransform: 'uppercase', letterSpacing: 0.5 },
  linkRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: '#f3f4f6', gap: 12 },
  linkRowLast: { borderBottomWidth: 0 },
  linkLabel: { flex: 1, fontSize: 16, color: '#111827', fontWeight: '500' },
});

