import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Linking,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';

export default function SupportScreen() {
  const router = useRouter();

  const handleOpenChat = () => {
    // Redirect to web support page with Intercom chat
    Linking.openURL('https://myxcrow.com/support');
  };

  const handleEmail = () => {
    Linking.openURL('mailto:support@myxcrow.com');
  };

  const faqItems = [
    {
      question: 'How does escrow work?',
      answer:
        'Escrow protects both buyers and sellers by holding funds until both parties fulfill their obligations. Funds are only released when delivery is confirmed.',
    },
    {
      question: 'How long does KYC verification take?',
      answer:
        'KYC verification typically takes 1-2 business days. Make sure your Ghana Card and selfie are clear and readable.',
    },
    {
      question: 'What are the fees?',
      answer:
        'Our platform charges a small percentage fee on each transaction. The exact fee depends on the transaction amount and is shown before you confirm.',
    },
    {
      question: 'How do I withdraw funds?',
      answer:
        'Go to your Wallet, tap Withdraw, enter the amount and your bank/mobile money details. Withdrawals are processed within 1-2 business days after approval.',
    },
    {
      question: 'What if there\'s a dispute?',
      answer:
        'If there\'s an issue, you can open a dispute from the escrow details page. Provide evidence and our team will mediate to reach a fair resolution.',
    },
  ];

  return (
    <ScrollView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Ionicons name="help-circle" size={64} color="#3b82f6" />
        <Text style={styles.headerTitle}>How Can We Help?</Text>
        <Text style={styles.headerSubtitle}>
          Get support and answers to common questions
        </Text>
      </View>

      {/* Contact Options */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Contact Support</Text>

        <TouchableOpacity style={styles.contactCard} onPress={handleOpenChat}>
          <View style={styles.contactIcon}>
            <Ionicons name="chatbubbles" size={24} color="#3b82f6" />
          </View>
          <View style={styles.contactContent}>
            <Text style={styles.contactTitle}>Live Chat</Text>
            <Text style={styles.contactDescription}>Chat with our support team in real-time</Text>
          </View>
          <Ionicons name="chevron-forward" size={20} color="#9ca3af" />
        </TouchableOpacity>

        <TouchableOpacity style={styles.contactCard} onPress={handleEmail}>
          <View style={styles.contactIcon}>
            <Ionicons name="mail" size={24} color="#10b981" />
          </View>
          <View style={styles.contactContent}>
            <Text style={styles.contactTitle}>Email Support</Text>
            <Text style={styles.contactDescription}>support@myxcrow.com</Text>
          </View>
          <Ionicons name="chevron-forward" size={20} color="#9ca3af" />
        </TouchableOpacity>
      </View>

      {/* FAQ Section */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Frequently Asked Questions</Text>
        {faqItems.map((item, index) => (
          <View key={index} style={styles.faqItem}>
            <View style={styles.faqHeader}>
              <Ionicons name="help-circle-outline" size={20} color="#3b82f6" />
              <Text style={styles.faqQuestion}>{item.question}</Text>
            </View>
            <Text style={styles.faqAnswer}>{item.answer}</Text>
          </View>
        ))}
      </View>

      {/* Tips Section */}
      <View style={styles.tipsCard}>
        <Ionicons name="bulb" size={24} color="#f59e0b" />
        <View style={styles.tipsContent}>
          <Text style={styles.tipsTitle}>Helpful Tip</Text>
          <Text style={styles.tipsText}>
            When reporting an issue, include your escrow ID and screenshots. This helps our team
            assist you faster!
          </Text>
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
  header: {
    backgroundColor: '#fff',
    padding: 32,
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#111827',
    marginTop: 16,
  },
  headerSubtitle: {
    fontSize: 14,
    color: '#6b7280',
    marginTop: 8,
    textAlign: 'center',
  },
  section: {
    backgroundColor: '#fff',
    marginTop: 16,
    padding: 16,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 12,
  },
  contactCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    backgroundColor: '#f9fafb',
    borderRadius: 12,
    marginBottom: 12,
  },
  contactIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#fff',
    justifyContent: 'center',
    alignItems: 'center',
  },
  contactContent: {
    flex: 1,
    marginLeft: 12,
  },
  contactTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: '#111827',
  },
  contactDescription: {
    fontSize: 13,
    color: '#6b7280',
    marginTop: 2,
  },
  faqItem: {
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f3f4f6',
  },
  faqHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  faqQuestion: {
    flex: 1,
    fontSize: 15,
    fontWeight: '600',
    color: '#111827',
    marginLeft: 8,
  },
  faqAnswer: {
    fontSize: 14,
    color: '#6b7280',
    lineHeight: 20,
    marginLeft: 28,
  },
  tipsCard: {
    flexDirection: 'row',
    backgroundColor: '#fef3c7',
    margin: 16,
    padding: 16,
    borderRadius: 12,
    alignItems: 'flex-start',
  },
  tipsContent: {
    flex: 1,
    marginLeft: 12,
  },
  tipsTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: '#92400e',
    marginBottom: 4,
  },
  tipsText: {
    fontSize: 13,
    color: '#92400e',
    lineHeight: 18,
  },
});
