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
import { useAuth } from '../../src/contexts/AuthContext';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import * as ImagePicker from 'expo-image-picker';
import { Camera } from 'expo-camera';

const registerSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
  firstName: z.string().min(1, 'First name is required'),
  lastName: z.string().min(1, 'Last name is required'),
  phone: z
    .string()
    .min(10, 'Phone number must be at least 10 digits')
    .regex(/^(\+233|0)[0-9]{9}$/, 'Invalid Ghana phone number format'),
  ghanaCardNumber: z
    .string()
    .min(1, 'Ghana Card number is required')
    .regex(/^GHA-[0-9]{9}-[0-9]$/, 'Invalid Ghana Card format (e.g., GHA-123456789-1)'),
  role: z.enum(['BUYER', 'SELLER']).default('BUYER'),
});

type RegisterFormData = z.infer<typeof registerSchema>;

export default function RegisterScreen() {
  const router = useRouter();
  const { register } = useAuth();
  const [loading, setLoading] = useState(false);
  const [step, setStep] = useState(1);
  const [cardFront, setCardFront] = useState<ImagePicker.ImagePickerAsset | null>(null);
  const [cardBack, setCardBack] = useState<ImagePicker.ImagePickerAsset | null>(null);
  const [selfie, setSelfie] = useState<ImagePicker.ImagePickerAsset | null>(null);
  const [cameraPermission, setCameraPermission] = useState<boolean | null>(null);

  const {
    control,
    handleSubmit,
    formState: { errors },
    watch,
  } = useForm<RegisterFormData>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      role: 'BUYER',
    },
  });

  React.useEffect(() => {
    (async () => {
      const { status } = await Camera.requestCameraPermissionsAsync();
      setCameraPermission(status === 'granted');
    })();
  }, []);

  const pickImage = async (type: 'cardFront' | 'cardBack' | 'selfie') => {
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [4, 3],
        quality: 0.8,
      });

      if (!result.canceled && result.assets[0]) {
        if (type === 'cardFront') setCardFront(result.assets[0]);
        else if (type === 'cardBack') setCardBack(result.assets[0]);
        else setSelfie(result.assets[0]);
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to pick image');
    }
  };

  const takePicture = async (type: 'cardFront' | 'cardBack' | 'selfie') => {
    if (cameraPermission === false) {
      Alert.alert('Permission Required', 'Camera permission is required to take photos');
      return;
    }

    try {
      const result = await ImagePicker.launchCameraAsync({
        allowsEditing: true,
        aspect: [4, 3],
        quality: 0.8,
      });

      if (!result.canceled && result.assets[0]) {
        if (type === 'cardFront') setCardFront(result.assets[0]);
        else if (type === 'cardBack') setCardBack(result.assets[0]);
        else setSelfie(result.assets[0]);
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to take picture');
    }
  };

  const onSubmit = async (data: RegisterFormData) => {
    if (!cardFront || !cardBack || !selfie) {
      Alert.alert('Missing Documents', 'Please upload Ghana Card front, back, and selfie photo');
      return;
    }

    try {
      setLoading(true);
      await register({
        ...data,
        cardFront,
        cardBack,
        selfie,
      });
      router.replace('/(tabs)/dashboard');
    } catch (error: any) {
      Alert.alert('Registration Failed', error.message || 'Please try again');
    } finally {
      setLoading(false);
    }
  };

  const canProceedToStep2 = () => {
    const values = watch();
    return (
      values.email &&
      values.password &&
      values.firstName &&
      values.lastName &&
      values.phone &&
      values.ghanaCardNumber &&
      !errors.email &&
      !errors.password &&
      !errors.firstName &&
      !errors.lastName &&
      !errors.phone &&
      !errors.ghanaCardNumber
    );
  };

  if (step === 1) {
    return (
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.container}
      >
        <ScrollView style={styles.scrollView} contentContainerStyle={styles.content}>
          <Text style={styles.title}>Create Account</Text>
          <Text style={styles.subtitle}>Step 1 of 2: Personal Information</Text>

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
              <Text style={styles.label}>Ghana Card Number</Text>
              <Controller
                control={control}
                name="ghanaCardNumber"
                render={({ field: { onChange, onBlur, value } }) => (
                  <TextInput
                    style={[styles.input, errors.ghanaCardNumber && styles.inputError]}
                    placeholder="GHA-123456789-1"
                    value={value}
                    onChangeText={onChange}
                    onBlur={onBlur}
                  />
                )}
              />
              {errors.ghanaCardNumber && (
                <Text style={styles.errorText}>{errors.ghanaCardNumber.message}</Text>
              )}
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
              style={[styles.button, !canProceedToStep2() && styles.buttonDisabled]}
              onPress={() => setStep(2)}
              disabled={!canProceedToStep2()}
            >
              <Text style={styles.buttonText}>Continue to KYC</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    );
  }

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={styles.container}
    >
      <ScrollView style={styles.scrollView} contentContainerStyle={styles.content}>
        <Text style={styles.title}>KYC Verification</Text>
        <Text style={styles.subtitle}>Step 2 of 2: Upload Documents</Text>

        <View style={styles.form}>
          <Text style={styles.sectionTitle}>Ghana Card Front</Text>
          <DocumentUpload
            value={cardFront}
            onPickImage={() => pickImage('cardFront')}
            onTakePicture={() => takePicture('cardFront')}
            cameraPermission={cameraPermission}
          />

          <Text style={styles.sectionTitle}>Ghana Card Back</Text>
          <DocumentUpload
            value={cardBack}
            onPickImage={() => pickImage('cardBack')}
            onTakePicture={() => takePicture('cardBack')}
            cameraPermission={cameraPermission}
          />

          <Text style={styles.sectionTitle}>Selfie Photo</Text>
          <DocumentUpload
            value={selfie}
            onPickImage={() => pickImage('selfie')}
            onTakePicture={() => takePicture('selfie')}
            cameraPermission={cameraPermission}
          />

          <TouchableOpacity
            style={[styles.button, loading && styles.buttonDisabled]}
            onPress={handleSubmit(onSubmit)}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.buttonText}>Complete Registration</Text>
            )}
          </TouchableOpacity>

          <TouchableOpacity style={styles.backButton} onPress={() => setStep(1)}>
            <Text style={styles.backButtonText}>← Back</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

function DocumentUpload({
  value,
  onPickImage,
  onTakePicture,
  cameraPermission,
}: {
  value: ImagePicker.ImagePickerAsset | null;
  onPickImage: () => void;
  onTakePicture: () => void;
  cameraPermission: boolean | null;
}) {
  if (value) {
    return (
      <View style={styles.imagePreview}>
        <Text style={styles.imagePreviewText}>✓ Photo uploaded</Text>
        <TouchableOpacity style={styles.removeButton} onPress={() => {}}>
          <Text style={styles.removeButtonText}>Remove</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.uploadContainer}>
      <TouchableOpacity style={styles.uploadButton} onPress={onTakePicture}>
        <Text style={styles.uploadButtonText}>📷 Take Photo</Text>
      </TouchableOpacity>
      <TouchableOpacity style={[styles.uploadButton, styles.uploadButtonSecondary]} onPress={onPickImage}>
        <Text style={[styles.uploadButtonText, styles.uploadButtonTextSecondary]}>📁 Choose from Gallery</Text>
      </TouchableOpacity>
    </View>
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
  backButton: {
    marginTop: 16,
    alignItems: 'center',
  },
  backButtonText: {
    color: '#3b82f6',
    fontSize: 14,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginTop: 20,
    marginBottom: 12,
  },
  uploadContainer: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 16,
  },
  uploadButton: {
    flex: 1,
    backgroundColor: '#3b82f6',
    borderRadius: 8,
    padding: 16,
    alignItems: 'center',
  },
  uploadButtonSecondary: {
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#3b82f6',
  },
  uploadButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  uploadButtonTextSecondary: {
    color: '#3b82f6',
  },
  imagePreview: {
    backgroundColor: '#d1fae5',
    borderRadius: 8,
    padding: 16,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  imagePreviewText: {
    color: '#059669',
    fontWeight: '600',
  },
  removeButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  removeButtonText: {
    color: '#dc2626',
    fontSize: 14,
  },
});
