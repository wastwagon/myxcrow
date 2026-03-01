import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useQuery } from '../../../src/hooks/useQuery';
import apiClient from '../../../src/lib/api-client';
import Toast from 'react-native-toast-message';

interface FeeSettings {
  percentage: number;
  fixedCents: number;
  paidBy: 'buyer' | 'seller' | 'split';
}

export default function FeeManagementScreen() {
  const queryClient = useQueryClient();
  const [percentage, setPercentage] = useState(0);
  const [fixedCents, setFixedCents] = useState(0);
  const [feePaidBy, setFeePaidBy] = useState<'buyer' | 'seller' | 'split'>('buyer');

  const { data: settings, isLoading } = useQuery<FeeSettings>({
    queryKey: ['fee-settings'],
    url: '/settings/fees',
  });

  useEffect(() => {
    if (settings) {
      setPercentage(settings.percentage ?? 0);
      setFixedCents(settings.fixedCents ?? 0);
      setFeePaidBy(settings.paidBy ?? 'buyer');
    }
  }, [settings]);

  const updateMutation = useMutation({
    mutationFn: async (data: Partial<FeeSettings>) => {
      return apiClient.put('/settings/fees', data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['fee-settings'] });
      Toast.show({ type: 'success', text1: 'Success', text2: 'Fee settings updated' });
    },
    onError: (error: any) => {
      Toast.show({
        type: 'error',
        text1: 'Error',
        text2: error.response?.data?.message || 'Failed to update fees',
      });
    },
  });

  const handleSave = () => {
    updateMutation.mutate({
      percentage,
      fixedCents,
      paidBy: feePaidBy,
    });
  };

  const calculateExampleFee = (amountCents: number) => {
    const percentageFee = Math.round((amountCents * percentage) / 100);
    const totalFee = percentageFee + fixedCents;
    return {
      amount: amountCents / 100,
      percentageFee: percentageFee / 100,
      fixedFee: fixedCents / 100,
      totalFee: totalFee / 100,
      netAmount: (amountCents - totalFee) / 100,
    };
  };

  const example1 = calculateExampleFee(10000);
  const example2 = calculateExampleFee(50000);
  const example3 = calculateExampleFee(100000);

  return (
    <ScrollView style={styles.container}>
      <View style={styles.warningCard}>
        <Ionicons name="warning" size={20} color="#f59e0b" />
        <Text style={styles.warningText}>
          Changes apply to new escrows only. Existing escrows keep their original fee structure.
        </Text>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Fee Structure</Text>
        <View style={styles.field}>
          <Text style={styles.label}>Percentage Fee (%)</Text>
          <TextInput
            style={styles.input}
            value={String(percentage)}
            onChangeText={(v) => setPercentage(parseFloat(v) || 0)}
            keyboardType="decimal-pad"
          />
        </View>
        <View style={styles.field}>
          <Text style={styles.label}>Fixed Fee (₵)</Text>
          <TextInput
            style={styles.input}
            value={String(fixedCents / 100)}
            onChangeText={(v) => setFixedCents(Math.round((parseFloat(v) || 0) * 100))}
            keyboardType="decimal-pad"
          />
        </View>
        <View style={styles.field}>
          <Text style={styles.label}>Fee Paid By</Text>
          <View style={styles.optionRow}>
            {(['buyer', 'seller', 'split'] as const).map((opt) => (
              <TouchableOpacity
                key={opt}
                style={[styles.optionChip, feePaidBy === opt && styles.optionChipActive]}
                onPress={() => setFeePaidBy(opt)}
              >
                <Text style={[styles.optionChipText, feePaidBy === opt && styles.optionChipTextActive]}>
                  {opt === 'split' ? 'Split' : opt.charAt(0).toUpperCase() + opt.slice(1)}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>
        <TouchableOpacity
          style={styles.saveButton}
          onPress={handleSave}
          disabled={updateMutation.isPending || isLoading}
        >
          {updateMutation.isPending ? (
            <ActivityIndicator color="#fff" size="small" />
          ) : (
            <>
              <Ionicons name="save-outline" size={20} color="#fff" />
              <Text style={styles.saveButtonText}>Save Fee Settings</Text>
            </>
          )}
        </TouchableOpacity>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Fee Examples</Text>
        <View style={styles.exampleCard}>
          <Text style={styles.exampleLabel}>Escrow: {example1.amount.toFixed(2)} ₵</Text>
          <Text style={styles.exampleRow}>Percentage ({percentage}%): {example1.percentageFee.toFixed(2)} ₵</Text>
          <Text style={styles.exampleRow}>Fixed: {example1.fixedFee.toFixed(2)} ₵</Text>
          <Text style={[styles.exampleRow, styles.exampleTotal]}>Total Fee: {example1.totalFee.toFixed(2)} ₵</Text>
          <Text style={styles.exampleRow}>Net to seller: {example1.netAmount.toFixed(2)} ₵</Text>
        </View>
        <View style={styles.exampleCard}>
          <Text style={styles.exampleLabel}>Escrow: {example2.amount.toFixed(2)} ₵</Text>
          <Text style={styles.exampleRow}>Percentage ({percentage}%): {example2.percentageFee.toFixed(2)} ₵</Text>
          <Text style={styles.exampleRow}>Fixed: {example2.fixedFee.toFixed(2)} ₵</Text>
          <Text style={[styles.exampleRow, styles.exampleTotal]}>Total Fee: {example2.totalFee.toFixed(2)} ₵</Text>
          <Text style={styles.exampleRow}>Net to seller: {example2.netAmount.toFixed(2)} ₵</Text>
        </View>
        <View style={styles.exampleCard}>
          <Text style={styles.exampleLabel}>Escrow: {example3.amount.toFixed(2)} ₵</Text>
          <Text style={styles.exampleRow}>Percentage ({percentage}%): {example3.percentageFee.toFixed(2)} ₵</Text>
          <Text style={styles.exampleRow}>Fixed: {example3.fixedFee.toFixed(2)} ₵</Text>
          <Text style={[styles.exampleRow, styles.exampleTotal]}>Total Fee: {example3.totalFee.toFixed(2)} ₵</Text>
          <Text style={styles.exampleRow}>Net to seller: {example3.netAmount.toFixed(2)} ₵</Text>
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f9fafb',
  },
  warningCard: {
    flexDirection: 'row',
    backgroundColor: '#fef3c7',
    margin: 16,
    padding: 16,
    borderRadius: 12,
    alignItems: 'flex-start',
  },
  warningText: {
    flex: 1,
    fontSize: 13,
    color: '#92400e',
    marginLeft: 12,
  },
  section: {
    backgroundColor: '#fff',
    marginHorizontal: 16,
    marginBottom: 16,
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 16,
  },
  field: {
    marginBottom: 16,
  },
  label: {
    fontSize: 14,
    fontWeight: '500',
    color: '#374151',
    marginBottom: 8,
  },
  input: {
    borderWidth: 1,
    borderColor: '#e5e7eb',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 15,
    color: '#111827',
  },
  optionRow: {
    flexDirection: 'row',
    gap: 8,
  },
  optionChip: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 8,
    backgroundColor: '#f3f4f6',
  },
  optionChipActive: {
    backgroundColor: '#3b82f6',
  },
  optionChipText: {
    fontSize: 13,
    fontWeight: '500',
    color: '#6b7280',
  },
  optionChipTextActive: {
    color: '#fff',
  },
  saveButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#3b82f6',
    paddingVertical: 12,
    borderRadius: 8,
    gap: 8,
    marginTop: 8,
  },
  saveButtonText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#fff',
  },
  exampleCard: {
    backgroundColor: '#f9fafb',
    padding: 16,
    borderRadius: 8,
    marginBottom: 12,
  },
  exampleLabel: {
    fontSize: 15,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 8,
  },
  exampleRow: {
    fontSize: 13,
    color: '#6b7280',
    marginTop: 4,
  },
  exampleTotal: {
    fontWeight: '600',
    color: '#111827',
    marginTop: 8,
  },
});
