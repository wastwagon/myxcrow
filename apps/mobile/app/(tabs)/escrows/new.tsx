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
  Switch,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm, Controller, useFieldArray } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import apiClient from '../../../src/lib/api-client';
import { getErrorMessage } from '../../../src/lib/error-messages';
import { CURRENCY_SYMBOL } from '../../../src/lib/constants';
import Toast from 'react-native-toast-message';

const milestoneSchema = z.object({
  name: z.string().min(1, 'Milestone name is required'),
  description: z.string().optional(),
  amountCents: z.number().min(0.01, 'Amount must be at least 0.01'),
});

const createEscrowSchema = z.object({
  sellerId: z.string().regex(/^0[0-9]{9}$/, 'Enter seller Ghana phone (e.g. 0551234567)'),
  amountCents: z.number().min(1, 'Amount must be at least 1.00'),
  currency: z.string().default('GHS'),
  description: z.string().min(1, 'Description is required'),
  useMilestones: z.boolean().default(false),
  milestones: z.array(milestoneSchema).optional(),
  deliveryRegion: z.string().optional(),
  deliveryCity: z.string().optional(),
  deliveryAddressLine: z.string().optional(),
  deliveryPhone: z.string().optional(),
}).refine((data) => {
  if (data.useMilestones && data.milestones && data.milestones.length > 0) {
    const totalMilestones = data.milestones.reduce((sum, m) => sum + (m.amountCents || 0), 0);
    return totalMilestones <= data.amountCents;
  }
  return true;
}, { message: 'Total milestone amounts cannot exceed escrow amount', path: ['milestones'] });

type CreateEscrowFormData = z.infer<typeof createEscrowSchema>;

export default function CreateEscrowScreen() {
  const router = useRouter();
  const queryClient = useQueryClient();

  const {
    control,
    handleSubmit,
    formState: { errors },
    watch,
  } = useForm<CreateEscrowFormData>({
    resolver: zodResolver(createEscrowSchema),
    defaultValues: {
      currency: 'GHS',
      useMilestones: false,
      milestones: [],
    },
  });

  const { fields, append, remove } = useFieldArray({ control, name: 'milestones' });
  const useMilestones = watch('useMilestones');
  const amountCents = watch('amountCents') || 0;
  const milestones = watch('milestones') || [];

  const createMutation = useMutation({
    mutationFn: async (data: CreateEscrowFormData) => {
      const payload: any = {
        sellerPhone: data.sellerId,
        sellerId: data.sellerId,
        amountCents: Math.round(data.amountCents * 100),
        currency: data.currency,
        description: data.description,
        useWallet: true,
        deliveryRegion: data.deliveryRegion || undefined,
        deliveryCity: data.deliveryCity || undefined,
        deliveryAddressLine: data.deliveryAddressLine || undefined,
        deliveryPhone: data.deliveryPhone || undefined,
      };
      if (data.useMilestones && data.milestones && data.milestones.length > 0) {
        payload.milestones = data.milestones.map((m) => ({
          name: m.name,
          description: m.description,
          amountCents: Math.round(m.amountCents * 100),
        }));
      }
      return apiClient.post('/escrows', payload);
    },
    onSuccess: (response) => {
      const escrowId = response.data.id;
      queryClient.invalidateQueries({ queryKey: ['escrows'] });
      queryClient.invalidateQueries({ queryKey: ['wallet'] });
      Toast.show({
        type: 'success',
        text1: 'Success',
        text2: 'Escrow created successfully',
      });
      router.replace(`/(tabs)/escrows/${escrowId}`);
    },
    onError: (error: any) => {
      Toast.show({
        type: 'error',
        text1: 'Error',
        text2: getErrorMessage(error, 'Failed to create escrow'),
      });
    },
  });

  const onSubmit = (data: CreateEscrowFormData) => {
    createMutation.mutate(data);
  };

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
          <Text style={styles.title}>Create Escrow</Text>
        </View>

        <View style={styles.form}>
          <View style={styles.inputContainer}>
            <Text style={styles.label}>Seller Phone *</Text>
            <Controller
              control={control}
              name="sellerId"
              render={({ field: { onChange, onBlur, value } }) => (
                <TextInput
                  style={[styles.input, errors.sellerId && styles.inputError]}
                  placeholder="0551234567"
                  keyboardType="phone-pad"
                  value={value}
                  onChangeText={onChange}
                  onBlur={onBlur}
                />
              )}
            />
            {errors.sellerId && <Text style={styles.errorText}>{errors.sellerId.message}</Text>}
            <Text style={styles.helpText}>Enter the seller's Ghana phone. They must be registered.</Text>
          </View>

          <View style={styles.inputContainer}>
            <Text style={styles.label}>Description *</Text>
            <Controller
              control={control}
              name="description"
              render={({ field: { onChange, onBlur, value } }) => (
                <TextInput
                  style={[styles.textArea, errors.description && styles.inputError]}
                  placeholder="Describe the item or service..."
                  multiline
                  numberOfLines={4}
                  value={value}
                  onChangeText={onChange}
                  onBlur={onBlur}
                  textAlignVertical="top"
                />
              )}
            />
            {errors.description && <Text style={styles.errorText}>{errors.description.message}</Text>}
          </View>

          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Delivery address (ship to)</Text>
            <Text style={styles.helpText}>Where the seller should send the item</Text>
          </View>
          <View style={styles.inputContainer}>
            <Text style={styles.label}>Region</Text>
            <Controller
              control={control}
              name="deliveryRegion"
              render={({ field: { onChange, onBlur, value } }) => (
                <TextInput
                  style={styles.input}
                  placeholder="e.g. Greater Accra"
                  value={value || ''}
                  onChangeText={onChange}
                  onBlur={onBlur}
                />
              )}
            />
          </View>
          <View style={styles.inputContainer}>
            <Text style={styles.label}>City / Town</Text>
            <Controller
              control={control}
              name="deliveryCity"
              render={({ field: { onChange, onBlur, value } }) => (
                <TextInput
                  style={styles.input}
                  placeholder="e.g. Accra"
                  value={value || ''}
                  onChangeText={onChange}
                  onBlur={onBlur}
                />
              )}
            />
          </View>
          <View style={styles.inputContainer}>
            <Text style={styles.label}>Street / Landmark</Text>
            <Controller
              control={control}
              name="deliveryAddressLine"
              render={({ field: { onChange, onBlur, value } }) => (
                <TextInput
                  style={styles.input}
                  placeholder="Street, area, or landmark"
                  value={value || ''}
                  onChangeText={onChange}
                  onBlur={onBlur}
                />
              )}
            />
          </View>
          <View style={styles.inputContainer}>
            <Text style={styles.label}>Contact phone for delivery (optional)</Text>
            <Controller
              control={control}
              name="deliveryPhone"
              render={({ field: { onChange, onBlur, value } }) => (
                <TextInput
                  style={styles.input}
                  placeholder="0551234567"
                  keyboardType="phone-pad"
                  value={value || ''}
                  onChangeText={onChange}
                  onBlur={onBlur}
                />
              )}
            />
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
            <Text style={styles.helpText}>Enter amount in Ghana Cedis</Text>
          </View>

          <View style={styles.infoBox}>
            <Text style={styles.infoText}>
              The escrow will be funded from your wallet balance. Make sure you have sufficient funds.
            </Text>
          </View>

          <View style={[styles.sectionHeader, { marginTop: 24 }]}>
            <View style={styles.switchContainer}>
              <Text style={styles.sectionTitle}>Use Milestone Payments</Text>
              <Controller
                control={control}
                name="useMilestones"
                render={({ field: { onChange, value } }) => (
                  <Switch value={value} onValueChange={onChange} />
                )}
              />
            </View>
            <Text style={styles.helpText}>
              Split the escrow into multiple milestone payments. Funds released incrementally as milestones complete.
            </Text>
          </View>

          {useMilestones && (
            <View style={styles.milestonesSection}>
              {fields.map((field, index) => (
                <View key={field.id} style={styles.milestoneCard}>
                  <View style={styles.milestoneHeader}>
                    <Text style={styles.milestoneTitle}>Milestone {index + 1}</Text>
                    <TouchableOpacity onPress={() => remove(index)}>
                      <Text style={styles.removeText}>Remove</Text>
                    </TouchableOpacity>
                  </View>
                  <Controller
                    control={control}
                    name={`milestones.${index}.name`}
                    render={({ field: { onChange, onBlur, value } }) => (
                      <TextInput
                        style={[styles.input, errors.milestones?.[index]?.name && styles.inputError]}
                        placeholder="e.g. Phase 1, Design Complete"
                        value={value || ''}
                        onChangeText={onChange}
                        onBlur={onBlur}
                      />
                    )}
                  />
                  {errors.milestones?.[index]?.name && (
                    <Text style={styles.errorText}>{errors.milestones[index]?.name?.message}</Text>
                  )}
                  <Controller
                    control={control}
                    name={`milestones.${index}.amountCents`}
                    render={({ field: { onChange, onBlur, value } }) => (
                      <TextInput
                        style={[styles.input, errors.milestones?.[index]?.amountCents && styles.inputError]}
                        placeholder="Amount (GHS)"
                        keyboardType="decimal-pad"
                        value={value ? String(value) : ''}
                        onChangeText={(text) => onChange(parseFloat(text) || 0)}
                        onBlur={onBlur}
                      />
                    )}
                  />
                  {errors.milestones?.[index]?.amountCents && (
                    <Text style={styles.errorText}>{errors.milestones[index]?.amountCents?.message}</Text>
                  )}
                </View>
              ))}
              <TouchableOpacity style={styles.addMilestoneButton} onPress={() => append({ name: '', description: '', amountCents: 0 })}>
                <Text style={styles.addMilestoneText}>+ Add Milestone</Text>
              </TouchableOpacity>
              {milestones.length > 0 && (
                <Text style={styles.helpText}>
                  Total milestones: {CURRENCY_SYMBOL}{(milestones.reduce((s, m) => s + (m.amountCents || 0), 0)).toFixed(2)} / {CURRENCY_SYMBOL}{amountCents.toFixed(2)}
                </Text>
              )}
              {errors.milestones && typeof errors.milestones === 'object' && 'message' in errors.milestones && (
                <Text style={styles.errorText}>{errors.milestones.message}</Text>
              )}
            </View>
          )}

          <TouchableOpacity
            style={[styles.button, createMutation.isPending && styles.buttonDisabled]}
            onPress={handleSubmit(onSubmit)}
            disabled={createMutation.isPending}
          >
            {createMutation.isPending ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.buttonText}>Create Escrow</Text>
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
  inputContainer: {
    marginBottom: 20,
  },
  sectionHeader: {
    marginTop: 16,
    marginBottom: 8,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: '#e5e7eb',
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 4,
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
  textArea: {
    backgroundColor: '#f9fafb',
    borderRadius: 8,
    padding: 16,
    fontSize: 16,
    borderWidth: 1,
    borderColor: '#ddd',
    minHeight: 100,
  },
  inputError: {
    borderColor: '#ef4444',
  },
  errorText: {
    color: '#ef4444',
    fontSize: 12,
    marginTop: 4,
  },
  helpText: {
    fontSize: 12,
    color: '#666',
    marginTop: 4,
  },
  switchContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
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
  milestonesSection: {
    marginTop: 12,
  },
  milestoneCard: {
    backgroundColor: '#f9fafb',
    borderRadius: 8,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  milestoneHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  milestoneTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
  },
  removeText: {
    color: '#dc2626',
    fontSize: 14,
  },
  addMilestoneButton: {
    padding: 12,
    borderWidth: 2,
    borderColor: '#3b82f6',
    borderRadius: 8,
    borderStyle: 'dashed',
    alignItems: 'center',
  },
  addMilestoneText: {
    color: '#3b82f6',
    fontWeight: '600',
  },
});
