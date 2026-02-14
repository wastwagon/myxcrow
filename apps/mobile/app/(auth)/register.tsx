import React, { useState, useEffect, useRef } from 'react';
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
import { useAuth } from '../../src/contexts/AuthContext';
import { WEB_BASE_URL } from '../../src/lib/constants';
import apiClient from '../../src/lib/api-client';
import { getErrorMessage } from '../../src/lib/error-messages';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';

const registerSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
  firstName: z.string().min(1, 'First name is required'),
  lastName: z.string().min(1, 'Last name is required'),
  phone: z.string().regex(/^0[0-9]{9}$/, 'Enter Ghana phone (e.g. 0551234567)'),
  code: z.string().length(6, 'Enter the 6-digit code').optional(),
});

type RegisterFormData = z.infer<typeof registerSchema>;

export default function RegisterScreen() {
  const router = useRouter();
  const { register } = useAuth();
  const [loading, setLoading] = useState(false);
  const [codeSent, setCodeSent] = useState(false);
  const [devCode, setDevCode] = useState<string | null>(null);
  const [countdown, setCountdown] = useState(0);
  const countdownRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    return () => {
      if (countdownRef.current) clearInterval(countdownRef.current);
    };
  }, []);

  useEffect(() => {
    if (countdown <= 0 && countdownRef.current) {
      clearInterval(countdownRef.current);
      countdownRef.current = null;
    }
  }, [countdown]);

  const {
    control,
    handleSubmit,
    watch,
    setValue,
    formState: { errors },
  } = useForm<RegisterFormData>({
    resolver: zodResolver(registerSchema),
  });

  const phone = watch('phone');

  const onSendCode = async () => {
    const p = phone?.trim();
    if (!p || !/^0[0-9]{9}$/.test(p)) {
      Alert.alert('Error', 'Enter a valid Ghana phone number first');
      return;
    }
    try {
      setLoading(true);
      setDevCode(null);
      const res = await apiClient.post('/auth/send-phone-otp', { phone: p });
      setCodeSent(true);
      setCountdown(60);
      if (countdownRef.current) clearInterval(countdownRef.current);
      countdownRef.current = setInterval(() => setCountdown((c) => Math.max(0, c - 1)), 1000);
      if (res.data?.devCode) {
        setDevCode(res.data.devCode);
        setValue('code', res.data.devCode);
      }
    } catch (error: any) {
      Alert.alert('Error', getErrorMessage(error, 'Failed to send code'));
    } finally {
      setLoading(false);
    }
  };

  const onSubmit = async (data: RegisterFormData) => {
    if (!codeSent || !data.code || data.code.length !== 6) {
      Alert.alert('Error', 'Please request and enter the 6-digit verification code first');
      return;
    }
    try {
      setLoading(true);
      await register({ ...data, code: data.code });
      router.replace('/(tabs)/dashboard');
    } catch (error: any) {
      Alert.alert('Registration Failed', getErrorMessage(error, 'Please try again'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={styles.container}
    >
      <ScrollView style={styles.scrollView} contentContainerStyle={styles.content}>
        <Text style={styles.title}>Create Account</Text>
        <Text style={styles.subtitle}>Join MYXCROW to start secure transactions</Text>

        <View style={styles.form}>
          <View style={styles.inputContainer}>
            <Text style={styles.label}>First Name</Text>
            <Controller
              control={control}
              name="firstName"
              render={({ field: { onChange, onBlur, value } }) => (
                <TextInput
                  style={[styles.input, errors.firstName && styles.inputError]}
                  placeholder="Enter your first name"
                  value={value}
                  onChangeText={onChange}
                  onBlur={onBlur}
                />
              )}
            />
            {errors.firstName && <Text style={styles.errorText}>{errors.firstName.message}</Text>}
          </View>

          <View style={styles.inputContainer}>
            <Text style={styles.label}>Last Name</Text>
            <Controller
              control={control}
              name="lastName"
              render={({ field: { onChange, onBlur, value } }) => (
                <TextInput
                  style={[styles.input, errors.lastName && styles.inputError]}
                  placeholder="Enter your last name"
                  value={value}
                  onChangeText={onChange}
                  onBlur={onBlur}
                />
              )}
            />
            {errors.lastName && <Text style={styles.errorText}>{errors.lastName.message}</Text>}
          </View>

          <View style={styles.inputContainer}>
            <Text style={styles.label}>Email</Text>
            <Controller
              control={control}
              name="email"
              render={({ field: { onChange, onBlur, value } }) => (
                <TextInput
                  style={[styles.input, errors.email && styles.inputError]}
                  placeholder="Enter your email"
                  keyboardType="email-address"
                  autoCapitalize="none"
                  value={value}
                  onChangeText={onChange}
                  onBlur={onBlur}
                />
              )}
            />
            {errors.email && <Text style={styles.errorText}>{errors.email.message}</Text>}
          </View>

          <View style={styles.inputContainer}>
            <Text style={styles.label}>Phone</Text>
            <Controller
              control={control}
              name="phone"
              render={({ field: { onChange, onBlur, value } }) => (
                <TextInput
                  style={[styles.input, errors.phone && styles.inputError]}
                  placeholder="0551234567"
                  keyboardType="phone-pad"
                  value={value}
                  onChangeText={onChange}
                  onBlur={onBlur}
                />
              )}
            />
            {errors.phone && <Text style={styles.errorText}>{errors.phone.message}</Text>}
            <Text style={styles.helpText}>Ghana phone (e.g. 0551234567)</Text>
            {codeSent ? (
              <View style={styles.codeSentBox}>
                {devCode ? (
                  <>
                    <Text style={styles.codeSentText}>SMS not configured – use this code:</Text>
                    <Text style={styles.devCodeText}>{devCode}</Text>
                  </>
                ) : (
                  <Text style={styles.codeSentText}>Code sent! Check your phone.</Text>
                )}
              </View>
            ) : (
              <TouchableOpacity
                style={[styles.sendCodeButton, (!phone || !/^0[0-9]{9}$/.test(phone) || loading || countdown > 0) && styles.buttonDisabled]}
                onPress={onSendCode}
                disabled={!phone || !/^0[0-9]{9}$/.test(phone) || loading || countdown > 0}
              >
                <Text style={styles.sendCodeButtonText}>
                  {loading ? 'Sending...' : countdown > 0 ? `Resend in ${countdown}s` : 'Send verification code'}
                </Text>
              </TouchableOpacity>
            )}
          </View>

          {codeSent && (
            <View style={styles.inputContainer}>
              <Text style={styles.label}>Verification Code</Text>
              <Controller
                control={control}
                name="code"
                render={({ field: { onChange, onBlur, value } }) => (
                  <TextInput
                    style={[styles.input, styles.codeInput, errors.code && styles.inputError]}
                    placeholder="000000"
                    keyboardType="number-pad"
                    maxLength={6}
                    value={value}
                    onChangeText={onChange}
                    onBlur={onBlur}
                  />
                )}
              />
              {errors.code && <Text style={styles.errorText}>{errors.code.message}</Text>}
              <TouchableOpacity onPress={onSendCode} disabled={loading || countdown > 0} style={styles.resendLink}>
                <Text style={[styles.resendLinkText, (loading || countdown > 0) && styles.resendLinkDisabled]}>
                  {countdown > 0 ? `Resend code in ${countdown}s` : 'Resend code'}
                </Text>
              </TouchableOpacity>
            </View>
          )}

          <View style={styles.inputContainer}>
            <Text style={styles.label}>Password</Text>
            <Controller
              control={control}
              name="password"
              render={({ field: { onChange, onBlur, value } }) => (
                <TextInput
                  style={[styles.input, errors.password && styles.inputError]}
                  placeholder="At least 8 characters"
                  secureTextEntry
                  value={value}
                  onChangeText={onChange}
                  onBlur={onBlur}
                />
              )}
            />
            {errors.password && <Text style={styles.errorText}>{errors.password.message}</Text>}
          </View>

          <TouchableOpacity
            style={[styles.button, (loading || !codeSent) && styles.buttonDisabled]}
            onPress={handleSubmit(onSubmit)}
            disabled={loading || !codeSent}
          >
            {loading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.buttonText}>Create Account</Text>
            )}
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.loginLink}
            onPress={() => router.push('/(auth)/login')}
          >
            <Text style={styles.loginLinkText}>
              Already have an account? <Text style={styles.loginLinkTextBold}>Sign In</Text>
            </Text>
          </TouchableOpacity>

          <Text style={styles.legalText}>
            By registering you agree to our{' '}
            <Text style={styles.legalLink} onPress={() => Linking.openURL(`${WEB_BASE_URL}/terms`)}>
              Terms and Conditions
            </Text>
            {' '}and{' '}
            <Text style={styles.legalLink} onPress={() => Linking.openURL(`${WEB_BASE_URL}/privacy`)}>
              Privacy Policy
            </Text>
            .
          </Text>
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
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#1a1a1a',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 14,
    color: '#666',
    marginBottom: 24,
  },
  form: {
    width: '100%',
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
    backgroundColor: '#fff',
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
  loginLink: {
    marginTop: 16,
    alignItems: 'center',
  },
  loginLinkText: {
    color: '#666',
    fontSize: 14,
  },
  loginLinkTextBold: {
    color: '#3b82f6',
    fontWeight: '600',
  },
  legalText: {
    marginTop: 20,
    fontSize: 12,
    color: '#6b7280',
    textAlign: 'center',
  },
  legalLink: {
    color: '#3b82f6',
    fontWeight: '600',
    textDecorationLine: 'underline',
  },
  helpText: {
    fontSize: 12,
    color: '#6b7280',
    marginTop: 4,
  },
  sendCodeButton: {
    marginTop: 12,
    padding: 12,
    backgroundColor: '#fff',
    borderRadius: 8,
    borderWidth: 2,
    borderColor: '#6b2d2d',
    alignItems: 'center',
  },
  sendCodeButtonText: {
    color: '#6b2d2d',
    fontWeight: '600',
  },
  codeSentBox: {
    marginTop: 12,
    padding: 12,
    backgroundColor: '#dcfce7',
    borderRadius: 8,
  },
  codeSentText: {
    color: '#166534',
    fontSize: 14,
    textAlign: 'center',
  },
  devCodeText: {
    marginTop: 8,
    fontSize: 20,
    fontWeight: '700',
    letterSpacing: 8,
    textAlign: 'center',
    color: '#92400e',
  },
  codeInput: {
    textAlign: 'center',
    fontSize: 20,
    letterSpacing: 8,
  },
  resendLink: {
    marginTop: 8,
  },
  resendLinkText: {
    color: '#6b2d2d',
    fontSize: 14,
    fontWeight: '600',
  },
  resendLinkDisabled: {
    opacity: 0.6,
  },
});
