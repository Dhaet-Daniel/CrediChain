import React, { useState } from 'react';
import {
  Modal,
  View,
  Text,
  TextInput,
  Pressable,
  StyleSheet,
  ActivityIndicator,
  Platform,
} from 'react-native';

interface RevokeModalProps {
  visible: boolean;
  onConfirm: (reason: string) => Promise<void>;
  onCancel: () => void;
}

export function RevokeModal({ visible, onConfirm, onCancel }: RevokeModalProps) {
  const [reason, setReason] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleConfirm = async () => {
    if (!reason.trim()) {
      setError('A revocation reason is required for the audit trail.');
      return;
    }
    setLoading(true);
    setError('');
    try {
      await onConfirm(reason.trim());
      setReason('');
    } catch (e: any) {
      setError(e.message ?? 'Revocation failed.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      statusBarTranslucent
    >
      <View style={styles.overlay}>
        <View style={styles.dialog}>
          <Text style={styles.title}>Revoke Certificate</Text>
          <Text style={styles.subtitle}>
            This action is permanent and will be recorded in the audit trail.
          </Text>

          <TextInput
            style={[styles.input, error ? styles.inputError : null]}
            placeholder="Reason for revocation…"
            placeholderTextColor="#9ca3af"
            value={reason}
            onChangeText={(t) => { setReason(t); setError(''); }}
            multiline
            numberOfLines={3}
            textAlignVertical="top"
            autoFocus
          />

          {!!error && <Text style={styles.error}>{error}</Text>}

          <View style={styles.actions}>
            <Pressable
              style={[styles.btn, styles.cancelBtn]}
              onPress={() => { setReason(''); setError(''); onCancel(); }}
              disabled={loading}
            >
              <Text style={styles.cancelText}>Cancel</Text>
            </Pressable>

            <Pressable
              style={[styles.btn, styles.revokeBtn, loading && styles.disabled]}
              onPress={handleConfirm}
              disabled={loading}
            >
              {loading
                ? <ActivityIndicator color="#fff" size="small" />
                : <Text style={styles.revokeText}>Revoke</Text>
              }
            </Pressable>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.6)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  dialog: {
    backgroundColor: '#fff',
    borderRadius: 20,
    padding: 24,
    width: '100%',
    maxWidth: 400,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.25,
    shadowRadius: 16,
    elevation: 10,
  },
  title: {
    fontSize: 18,
    fontWeight: '700',
    color: '#dc2626',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 13,
    color: '#6b7280',
    marginBottom: 16,
    lineHeight: 18,
  },
  input: {
    borderWidth: 1.5,
    borderColor: '#e5e7eb',
    borderRadius: 12,
    padding: 12,
    fontSize: 14,
    color: '#111827',
    minHeight: 80,
    marginBottom: 8,
  },
  inputError: { borderColor: '#dc2626' },
  error: { fontSize: 12, color: '#dc2626', marginBottom: 12 },
  actions: { flexDirection: 'row', gap: 12, marginTop: 8 },
  btn: {
    flex: 1,
    height: 48,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  cancelBtn: { backgroundColor: '#f3f4f6' },
  cancelText: { color: '#374151', fontWeight: '600' },
  revokeBtn: { backgroundColor: '#dc2626' },
  revokeText: { color: '#fff', fontWeight: '700' },
  disabled: { opacity: 0.6 },
});