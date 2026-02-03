import React from 'react';
import { TouchableOpacity, Text, StyleSheet } from 'react-native';
import { showMessenger } from '../src/services/intercom';

export default function IntercomButton() {
  return (
    <TouchableOpacity style={styles.button} onPress={showMessenger}>
      <Text style={styles.buttonText}>💬 Support</Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  button: {
    backgroundColor: '#3b82f6',
    borderRadius: 24,
    paddingHorizontal: 20,
    paddingVertical: 12,
    position: 'absolute',
    bottom: 20,
    right: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
});
