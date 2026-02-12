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
import { useAuth } from '../../src/contexts/AuthContext';
import { WEB_BASE_URL } from '../../src/lib/constants';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';

const registerSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
  firstName: z.string().min(1, 'First name is required'),
  lastName: z.string().min(1, 'Last name is required'),
  phone: z
    .string()
    .min(10, 'Phone number must be at least 10 digits')
    .regex(/^(\+233|0)[0-9]{9}$/, 'Invalid Ghana phone number format'),
  role: z.enum(['BUYER', 'SELLER']).default('BUYER'),
});

type RegisterFormData = z.infer<typeof registerSchema>;

export default function RegisterScreen() {
  const router = useRouter();
  const { register } = useAuth();
  const [loading, setLoading] = useState(false);

  const {
    control,
    handleSubmit,
    formState: { errors },
  } = useForm<RegisterFormData>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      role: 'BUYER',
    },
  });

  const onSubmit = async (data: RegisterFormData) => {
    try {
      setLoading(true);
      await register(data);
      router.replace('/(tabs)/dashboard');
    } catch (error: any) {
      Alert.alert('Registration Failed', error.message || 'Please try again');
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
                  placeholder="+233XXXXXXXXX or 0XXXXXXXXX"
                  keyboardType="phone-pad"
                  value={value}
                  onChangeText={onChange}
                  onBlur={onBlur}
                />
              )}
            />
            {errors.phone && <Text style={styles.errorText}>{errors.phone.message}</Text>}
          </View>

          <View style={styles.inputContainer}>
            <Text style={styles.label}>Account Type</Text>
            <View style={styles.roleContainer}>
              <Controller
                control={control}
                name="role"
                render={({ field: { onChange, value } }) => (
                  <>
                    <TouchableOpacity
                      style={[styles.roleButton, value === 'BUYER' && styles.roleButtonActive]}
                      onPress={() => onChange('BUYER')}
                    >
                      <Text style={[styles.roleButtonText, value === 'BUYER' && styles.roleButtonTextActive]}>
                        👤 Buyer
                      </Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={[styles.roleButton, value === 'SELLER' && styles.roleButtonActive]}
                      onPress={() => onChange('SELLER')}
                    >
                      <Text style={[styles.roleButtonText, value === 'SELLER' && styles.roleButtonTextActive]}>
                        🏪 Seller
                      </Text>
                    </TouchableOpacity>
                  </>
                )}
              />
            </View>
          </View>

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
            style={[styles.button, loading && styles.buttonDisabled]}
            onPress={handleSubmit(onSubmit)}
            disabled={loading}
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
  roleContainer: {
    flexDirection: 'row',
    gap: 12,
  },
  roleButton: {
    flex: 1,
    backgroundColor: '#fff',
    borderRadius: 8,
    padding: 16,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#ddd',
  },
  roleButtonActive: {
    borderColor: '#3b82f6',
    backgroundColor: '#eff6ff',
  },
  roleButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#666',
  },
  roleButtonTextActive: {
    color: '#3b82f6',
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
});
