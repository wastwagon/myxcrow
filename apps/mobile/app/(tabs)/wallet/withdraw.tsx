import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useMutation } from '@tanstack/react-query';
import { useQuery } from '../../../src/hooks/useQuery';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import apiClient from '../../../src/lib/api-client';
import { useAuth } from '../../../src/contexts/AuthContext';
import { formatCurrency } from '../../../src/lib/constants';
import Toast from 'react-native-toast-message';

const withdrawSchema = z.object({
  amountCents: z.number().min(100, 'Amount must be at least 1.00'),
  methodType: z.enum(['BANK_ACCOUNT', 'MOBILE_MONEY']),
  accountNumber: z.string().optional(),
  bankName: z.string().optional(),
  accountName: z.string().optional(),
  mobileNumber: z.string().optional(),
  network: z.enum(['MTN', 'VODAFONE', 'AIRTELTIGO']).optional(),
}).refine((d) => {
  if (d.methodType === 'BANK_ACCOUNT') return !!(d.accountNumber && d.bankName && d.accountName);
  return !!(d.mobileNumber && d.network);
}, { message: 'Fill all required fields for selected method', path: ['accountNumber'] });

type WithdrawFormData = z.infer<typeof withdrawSchema>;

export default function WithdrawScreen() {
  const router = useRouter();
  const { user } = useAuth();
  const [methodType, setMethodType] = useState<'BANK_ACCOUNT' | 'MOBILE_MONEY'>('BANK_ACCOUNT');

  const { data: wallet } = useQuery({
    queryKey: ['wallet'],
    url: '/wallet',
  });

  const {
    control,
    handleSubmit,
    formState: { errors },
  } = useForm<WithdrawFormData>({
    resolver: zodResolver(withdrawSchema),
    defaultValues: { methodType: 'BANK_ACCOUNT' },
  });

  const withdrawMutation = useMutation({
    mutationFn: async (data: WithdrawFormData) => {
      const methodDetails: Record<string, string> = {};
      if (data.methodType === 'BANK_ACCOUNT') {
        methodDetails.accountNumber = data.accountNumber!;
        methodDetails.bankName = data.bankName!;
        methodDetails.accountName = data.accountName!;
      } else {
        methodDetails.mobileNumber = data.mobileNumber!;
        methodDetails.network = data.network!;
      }
      return apiClient.post('/wallet/withdraw', {
        amountCents: Math.round(data.amountCents * 100),
        methodType: data.methodType,
        methodDetails,
      });
    },
    onSuccess: () => {
      Toast.show({ type: 'success', text1: 'Success', text2: 'Withdrawal request submitted' });
      router.back();
    },
    onError: (e: any) => {
      Toast.show({
        type: 'error',
        text1: 'Error',
        text2: e.response?.data?.message || 'Failed to request withdrawal',
      });
    },
  });

  const onSubmit = (data: WithdrawFormData) => {
    Alert.alert(
      'Confirm',
      `Request withdrawal of ${formatCurrency(Math.round(data.amountCents * 100), 'GHS')}?`,
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Confirm', onPress: () => withdrawMutation.mutate(data) },
      ]
    );
  };

  const availableCents = wallet ? Number(wallet.availableCents) : 0;

  return (
    <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={styles.container}>
      <ScrollView contentContainerStyle={styles.content}>
        <TouchableOpacity onPress={() => router.back()} style={styles.back}>
          <Text style={styles.backText}>← Back</Text>
        </TouchableOpacity>
        <Text style={styles.title}>Request Withdrawal</Text>
        <View style={styles.balanceCard}>
          <Text style={styles.balanceLabel}>Available</Text>
          <Text style={styles.balanceAmount}>{formatCurrency(availableCents)}</Text>
        </View>

        <Controller
          control={control}
          name="methodType"
          render={({ field: { onChange, value } }) => (
            <View style={styles.methodRow}>
              {(['BANK_ACCOUNT', 'MOBILE_MONEY'] as const).map((m) => (
                <TouchableOpacity
                  key={m}
                  style={[styles.methodBtn, value === m && styles.methodBtnActive]}
                  onPress={() => { setMethodType(m); onChange(m); }}
                >
                  <Text style={[styles.methodBtnText, value === m && styles.methodBtnTextActive]}>
                    {m === 'BANK_ACCOUNT' ? 'Bank' : 'Mobile Money'}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          )}
        />

        <Controller
          control={control}
          name="amountCents"
          render={({ field: { onChange, onBlur, value } }) => (
            <View style={styles.field}>
              <Text style={styles.label}>Amount (GHS) *</Text>
              <TextInput
                style={styles.input}
                placeholder="100"
                keyboardType="decimal-pad"
                value={value ? String(value) : ''}
                onChangeText={(t) => onChange(parseFloat(t) || 0)}
                onBlur={onBlur}
              />
              {errors.amountCents && <Text style={styles.err}>{errors.amountCents.message}</Text>}
            </View>
          )}
        />

        {methodType === 'BANK_ACCOUNT' && (
          <>
            <Controller
              control={control}
              name="bankName"
              render={({ field: { onChange, onBlur, value } }) => (
                <View style={styles.field}>
                  <Text style={styles.label}>Bank name *</Text>
                  <TextInput style={styles.input} placeholder="e.g. GCB" value={value} onChangeText={onChange} onBlur={onBlur} />
                </View>
              )}
            />
            <Controller
              control={control}
              name="accountName"
              render={({ field: { onChange, onBlur, value } }) => (
                <View style={styles.field}>
                  <Text style={styles.label}>Account name *</Text>
                  <TextInput style={styles.input} placeholder="John Doe" value={value} onChangeText={onChange} onBlur={onBlur} />
                </View>
              )}
            />
            <Controller
              control={control}
              name="accountNumber"
              render={({ field: { onChange, onBlur, value } }) => (
                <View style={styles.field}>
                  <Text style={styles.label}>Account number *</Text>
                  <TextInput style={styles.input} placeholder="1234567890" keyboardType="numeric" value={value} onChangeText={onChange} onBlur={onBlur} />
                  {errors.accountNumber && <Text style={styles.err}>{errors.accountNumber.message}</Text>}
                </View>
              )}
            />
          </>
        )}

        {methodType === 'MOBILE_MONEY' && (
          <>
            <Controller
              control={control}
              name="network"
              render={({ field: { onChange, value } }) => (
                <View style={styles.field}>
                  <Text style={styles.label}>Network *</Text>
                  <View style={styles.methodRow}>
                    {(['MTN', 'VODAFONE', 'AIRTELTIGO'] as const).map((n) => (
                      <TouchableOpacity key={n} style={[styles.methodBtn, value === n && styles.methodBtnActive]} onPress={() => onChange(n)}>
                        <Text style={[styles.methodBtnText, value === n && styles.methodBtnTextActive]}>{n}</Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                </View>
              )}
            />
            <Controller
              control={control}
              name="mobileNumber"
              render={({ field: { onChange, onBlur, value } }) => (
                <View style={styles.field}>
                  <Text style={styles.label}>Mobile number *</Text>
                  <TextInput style={styles.input} placeholder="0XX XXX XXXX" keyboardType="phone-pad" value={value} onChangeText={onChange} onBlur={onBlur} />
                </View>
              )}
            />
          </>
        )}

        <TouchableOpacity
          style={[styles.submit, withdrawMutation.isPending && styles.submitDisabled]}
          onPress={handleSubmit(onSubmit)}
          disabled={withdrawMutation.isPending}
        >
          {withdrawMutation.isPending ? <ActivityIndicator color="#fff" /> : <Text style={styles.submitText}>Submit</Text>}
        </TouchableOpacity>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f5f5f5' },
  content: { padding: 20 },
  back: { marginBottom: 12 },
  backText: { fontSize: 16, color: '#3b82f6' },
  title: { fontSize: 24, fontWeight: 'bold', color: '#1a1a1a', marginBottom: 16 },
  balanceCard: { backgroundColor: '#3b82f6', borderRadius: 12, padding: 20, alignItems: 'center', marginBottom: 20 },
  balanceLabel: { fontSize: 14, color: '#fff', opacity: 0.9 },
  balanceAmount: { fontSize: 28, fontWeight: 'bold', color: '#fff' },
  methodRow: { flexDirection: 'row', gap: 12, marginBottom: 16 },
  methodBtn: { flex: 1, padding: 12, borderRadius: 8, borderWidth: 1, borderColor: '#ddd', alignItems: 'center' },
  methodBtnActive: { borderColor: '#3b82f6', backgroundColor: '#eff6ff' },
  methodBtnText: { fontSize: 14, color: '#333' },
  methodBtnTextActive: { color: '#3b82f6', fontWeight: '600' },
  field: { marginBottom: 16 },
  label: { fontSize: 14, fontWeight: '600', color: '#333', marginBottom: 8 },
  input: { backgroundColor: '#fff', borderRadius: 8, padding: 14, fontSize: 16, borderWidth: 1, borderColor: '#ddd' },
  err: { fontSize: 12, color: '#ef4444', marginTop: 4 },
  submit: { backgroundColor: '#3b82f6', borderRadius: 8, padding: 16, alignItems: 'center', marginTop: 20 },
  submitDisabled: { opacity: 0.6 },
  submitText: { color: '#fff', fontSize: 16, fontWeight: '600' },
});
