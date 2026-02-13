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
  Linking,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useMutation, useQuery } from '@tanstack/react-query';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import apiClient from '../../../src/lib/api-client';
import { useAuth } from '../../../src/contexts/AuthContext';
import { formatCurrency, CURRENCY_SYMBOL, WEB_BASE_URL } from '../../../src/lib/constants';
import Toast from 'react-native-toast-message';
import { WebView } from 'react-native-webview';

const topupSchema = z.object({
  amountCents: z.number().min(1, 'Amount must be at least 1.00'),
});

type TopupFormData = z.infer<typeof topupSchema>;

export default function WalletTopupScreen() {
  const router = useRouter();
  const { user } = useAuth();
  const [showWebView, setShowWebView] = useState(false);
  const [paymentUrl, setPaymentUrl] = useState<string | null>(null);

  const {
    control,
    handleSubmit,
    formState: { errors },
  } = useForm<TopupFormData>({
    resolver: zodResolver(topupSchema),
  });

  const initializeTopupMutation = useMutation({
    mutationFn: async (data: { amountCents: number }) => {
      const response = await apiClient.post('/payments/wallet/topup', {
        amountCents: Math.round(data.amountCents * 100), // Convert to cents
        email: user?.email,
        callbackUrl: `${WEB_BASE_URL.replace(/\/$/, '')}/wallet/topup/callback`,
      });
      return response.data;
    },
    onSuccess: (data) => {
      if (data.authorizationUrl) {
        setPaymentUrl(data.authorizationUrl);
        setShowWebView(true);
      } else {
        Toast.show({
          type: 'error',
          text1: 'Error',
          text2: 'Payment URL not received',
        });
      }
    },
    onError: (error: any) => {
      Toast.show({
        type: 'error',
        text1: 'Error',
        text2: error.response?.data?.message || 'Failed to initialize payment',
      });
    },
  });

  const verifyPaymentMutation = useMutation({
    mutationFn: async (reference: string) => {
      const response = await apiClient.get(`/payments/wallet/topup/verify/${reference}`);
      return response.data;
    },
    onSuccess: () => {
      Toast.show({
        type: 'success',
        text1: 'Success',
        text2: 'Wallet top-up successful!',
      });
      setShowWebView(false);
      router.back();
    },
    onError: (error: any) => {
      Toast.show({
        type: 'error',
        text1: 'Error',
        text2: error.response?.data?.message || 'Payment verification failed',
      });
    },
  });

  const onSubmit = (data: TopupFormData) => {
    initializeTopupMutation.mutate(data);
  };

  const handleWebViewNavigationStateChange = (navState: any) => {
    const { url } = navState;
    if (!url || typeof url !== 'string') return;

    // Paystack redirects to our callback URL with reference (or trxref) in query
    const isCallback =
      url.includes('/wallet/topup/callback') || url.includes('callback') || url.includes('success');
    if (!isCallback) return;

    try {
      const queryStart = url.indexOf('?');
      const queryString = queryStart >= 0 ? url.slice(queryStart + 1).split('#')[0] : '';
      const urlParams = new URLSearchParams(queryString);
      const reference = urlParams.get('reference') || urlParams.get('trxref');
      if (reference && !verifyPaymentMutation.isPending) {
        verifyPaymentMutation.mutate(reference);
      }
    } catch (_) {
      // ignore parse errors
    }
  };

  if (showWebView && paymentUrl) {
    return (
      <View style={styles.container}>
        <View style={styles.webViewHeader}>
          <TouchableOpacity
            onPress={() => {
              setShowWebView(false);
              setPaymentUrl(null);
            }}
            style={styles.closeButton}
          >
            <Text style={styles.closeButtonText}>✕ Close</Text>
          </TouchableOpacity>
        </View>
        <WebView
          source={{ uri: paymentUrl }}
          onNavigationStateChange={handleWebViewNavigationStateChange}
          style={styles.webView}
        />
      </View>
    );
  }

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={styles.container}
    >
      <ScrollView style={styles.scrollView} contentContainerStyle={styles.content}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()}>
            <Text style={styles.backButton}>← Back</Text>
          </TouchableOpacity>
          <Text style={styles.title}>Top Up Wallet</Text>
        </View>

        <View style={styles.form}>
          <View style={styles.balanceCard}>
            <Text style={styles.balanceLabel}>Current Balance</Text>
            <Text style={styles.balanceAmount}>
              {formatCurrency(user?.walletBalance || 0)}
            </Text>
          </View>

          <View style={styles.inputContainer}>
            <Text style={styles.label}>Amount ({CURRENCY_SYMBOL}) *</Text>
            <Controller
              control={control}
              name="amountCents"
              render={({ field: { onChange, onBlur, value } }) => (
                <TextInput
                  style={[styles.input, errors.amountCents && styles.inputError]}
                  placeholder="100.00"
                  keyboardType="decimal-pad"
                  value={value ? String(value) : ''}
                  onChangeText={(text) => {
                    const num = parseFloat(text) || 0;
                    onChange(num);
                  }}
                  onBlur={onBlur}
                />
              )}
            />
            {errors.amountCents && <Text style={styles.errorText}>{errors.amountCents.message}</Text>}
          </View>

          <View style={styles.infoBox}>
            <Text style={styles.infoText}>
              You will be redirected to Paystack to complete the payment securely.
            </Text>
          </View>

          <TouchableOpacity
            style={[styles.button, initializeTopupMutation.isPending && styles.buttonDisabled]}
            onPress={handleSubmit(onSubmit)}
            disabled={initializeTopupMutation.isPending}
          >
            {initializeTopupMutation.isPending ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.buttonText}>Continue to Payment</Text>
            )}
          </TouchableOpacity>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  scrollView: {
    flex: 1,
  },
  content: {
    padding: 20,
  },
  header: {
    marginBottom: 24,
  },
  backButton: {
    fontSize: 16,
    color: '#3b82f6',
    marginBottom: 8,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#1a1a1a',
  },
  form: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 20,
  },
  balanceCard: {
    backgroundColor: '#3b82f6',
    borderRadius: 12,
    padding: 20,
    alignItems: 'center',
    marginBottom: 24,
  },
  balanceLabel: {
    fontSize: 14,
    color: '#fff',
    opacity: 0.9,
    marginBottom: 8,
  },
  balanceAmount: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#fff',
  },
  inputContainer: {
    marginBottom: 20,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    marginBottom: 8,
  },
  input: {
    backgroundColor: '#f9fafb',
    borderRadius: 8,
    padding: 16,
    fontSize: 16,
    borderWidth: 1,
    borderColor: '#ddd',
  },
  inputError: {
    borderColor: '#ef4444',
  },
  errorText: {
    color: '#ef4444',
    fontSize: 12,
    marginTop: 4,
  },
  infoBox: {
    backgroundColor: '#dbeafe',
    borderRadius: 8,
    padding: 12,
    marginBottom: 20,
  },
  infoText: {
    fontSize: 14,
    color: '#1e40af',
  },
  button: {
    backgroundColor: '#3b82f6',
    borderRadius: 8,
    padding: 16,
    alignItems: 'center',
    marginTop: 10,
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  webViewHeader: {
    backgroundColor: '#fff',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  closeButton: {
    alignSelf: 'flex-end',
  },
  closeButtonText: {
    fontSize: 16,
    color: '#3b82f6',
    fontWeight: '600',
  },
  webView: {
    flex: 1,
  },
});
