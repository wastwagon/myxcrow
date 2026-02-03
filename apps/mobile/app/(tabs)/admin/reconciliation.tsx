import React from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

export default function ReconciliationScreen() {
  return (
    <ScrollView style={styles.container}>
      <View style={styles.section}>
        <Ionicons name="receipt-outline" size={48} color="#9ca3af" />
        <Text style={styles.title}>Financial Reconciliation</Text>
        <Text style={styles.subtitle}>
          Reconcile payments and generate financial reports
        </Text>
      </View>

      <View style={styles.featureList}>
        <View style={styles.featureItem}>
          <Ionicons name="sync-outline" size={20} color="#3b82f6" />
          <Text style={styles.featureText}>Payment Reconciliation</Text>
        </View>
        <View style={styles.featureItem}>
          <Ionicons name="document-text-outline" size={20} color="#3b82f6" />
          <Text style={styles.featureText}>Ledger Reports</Text>
        </View>
        <View style={styles.featureItem}>
          <Ionicons name="download-outline" size={20} color="#3b82f6" />
          <Text style={styles.featureText}>Export Financial Data</Text>
        </View>
        <View style={styles.featureItem}>
          <Ionicons name="bar-chart-outline" size={20} color="#3b82f6" />
          <Text style={styles.featureText}>Revenue Analytics</Text>
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
  section: {
    backgroundColor: '#fff',
    padding: 32,
    alignItems: 'center',
  },
  title: {
    fontSize: 20,
    fontWeight: '600',
    color: '#111827',
    marginTop: 16,
  },
  subtitle: {
    fontSize: 14,
    color: '#6b7280',
    marginTop: 8,
    textAlign: 'center',
  },
  featureList: {
    backgroundColor: '#fff',
    marginTop: 16,
    padding: 16,
  },
  featureItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f3f4f6',
  },
  featureText: {
    fontSize: 15,
    color: '#374151',
    marginLeft: 12,
  },
});
