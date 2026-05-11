import {
  SafeAreaView, ScrollView, View, Text,
  ActivityIndicator, TextInput, TouchableOpacity,
  Alert, StyleSheet, Image,
} from 'react-native';
import { ChevronLeft, Send, ImageIcon, X } from 'lucide-react-native';
import { useState } from 'react';
import { useRouter } from 'expo-router';
import * as ImagePicker from 'expo-image-picker';
import { supabase } from '@/config/supabase';
import { issueCredential, CredentialPayload } from '@/services/credentialService';

export default function IssueCredentialScreen() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [image, setImage] = useState<string | null>(null);
  const [form, setForm] = useState<CredentialPayload>({
    student_name: '',
    institution: 'University of Excellence',
    degree: '',
    issue_date: new Date().toISOString().split('T')[0],
  });
  const [errors, setErrors] = useState<Partial<CredentialPayload>>({});

  // ─── Validation ────────────────────────────────────────────────────────────

  function validate(): boolean {
    const newErrors: Partial<CredentialPayload> = {};
    if (!form.student_name.trim()) newErrors.student_name = 'Student name is required';
    if (!form.degree.trim()) newErrors.degree = 'Degree is required';
    if (!form.issue_date) newErrors.issue_date = 'Issue date is required';
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }

  // ─── Image Picker ──────────────────────────────────────────────────────────

  const pickImage = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permission needed', 'Photo library access is required to upload a scan.');
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: true,
      quality: 0.7,
    });
    if (!result.canceled) setImage(result.assets[0].uri);
  };

  // ─── Upload attachment to Supabase Storage ─────────────────────────────────

  async function uploadAttachment(localUri: string): Promise<string | null> {
    try {
      const fileName = `cert-${Date.now()}-${Math.random().toString(36).slice(2)}.jpg`;
      const response = await fetch(localUri);
      const blob = await response.blob();

      const { error } = await supabase.storage
        .from('credential-attachments')
        .upload(fileName, blob, { contentType: 'image/jpeg', upsert: false });

      if (error) throw error;

      const { data: { publicUrl } } = supabase.storage
        .from('credential-attachments')
        .getPublicUrl(fileName);

      return publicUrl;
    } catch (err) {
      console.error('Upload error:', err);
      return null; // Non-fatal — credential can still be issued without attachment
    }
  }

  // ─── Issue ────────────────────────────────────────────────────────────────

  const handleIssue = async () => {
    if (!validate()) return;
    setLoading(true);
    try {
      const attachmentUrl = image ? await uploadAttachment(image) : null;
      await issueCredential(form, attachmentUrl);
      Alert.alert(
        '✅ Credential Issued',
        'The credential has been recorded on the ledger and the hash has been generated from the credential data.',
        [{ text: 'OK', onPress: () => router.back() }]
      );
    } catch (err: any) {
      Alert.alert('Issuance Failed', err.message ?? 'An unknown error occurred.');
    } finally {
      setLoading(false);
    }
  };

  // ─── Render ───────────────────────────────────────────────────────────────

  return (
    <SafeAreaView style={styles.safe}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <ChevronLeft size={24} color="#111827" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Issue Credential</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView style={styles.scroll} contentContainerStyle={styles.content}>
        {/* Attachment */}
        {image ? (
          <View style={styles.imageContainer}>
            <Image source={{ uri: image }} style={styles.preview} resizeMode="cover" />
            <TouchableOpacity style={styles.removeImage} onPress={() => setImage(null)}>
              <X size={16} color="#fff" />
            </TouchableOpacity>
          </View>
        ) : (
          <TouchableOpacity style={styles.uploadZone} onPress={pickImage}>
            <ImageIcon size={28} color="#9ca3af" />
            <Text style={styles.uploadLabel}>Upload Paper Scan (optional)</Text>
          </TouchableOpacity>
        )}

        {/* Fields */}
        <Field
          label="Student Full Name *"
          value={form.student_name}
          onChangeText={(v) => setForm({ ...form, student_name: v })}
          error={errors.student_name}
          placeholder="e.g. Jane Smith"
          autoCapitalize="words"
        />
        <Field
          label="Institution *"
          value={form.institution}
          onChangeText={(v) => setForm({ ...form, institution: v })}
          error={errors.institution}
          placeholder="e.g. University of Excellence"
        />
        <Field
          label="Degree / Credential *"
          value={form.degree}
          onChangeText={(v) => setForm({ ...form, degree: v })}
          error={errors.degree}
          placeholder="e.g. B.Sc. Computer Science"
        />
        <Field
          label="Issue Date (YYYY-MM-DD) *"
          value={form.issue_date}
          onChangeText={(v) => setForm({ ...form, issue_date: v })}
          error={errors.issue_date}
          placeholder="2024-06-15"
          keyboardType="numeric"
        />

        {/* Info box */}
        <View style={styles.infoBox}>
          <Text style={styles.infoText}>
            🔐 A SHA-256 hash will be derived from the credential data and stored as the
            immutable ledger record. The hash uniquely identifies this exact credential.
          </Text>
        </View>

        {/* Submit */}
        <TouchableOpacity
          style={[styles.submitBtn, loading && styles.disabled]}
          onPress={handleIssue}
          disabled={loading}
        >
          {loading
            ? <ActivityIndicator color="#fff" />
            : <>
                <Send size={18} color="#fff" />
                <Text style={styles.submitText}>Issue to Ledger</Text>
              </>
          }
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

// ─── Sub-component: Field ─────────────────────────────────────────────────────

function Field({
  label, value, onChangeText, error, placeholder, autoCapitalize, keyboardType,
}: {
  label: string;
  value: string;
  onChangeText: (v: string) => void;
  error?: string;
  placeholder?: string;
  autoCapitalize?: 'none' | 'words' | 'sentences';
  keyboardType?: 'default' | 'numeric';
}) {
  return (
    <View style={styles.fieldWrapper}>
      <Text style={styles.label}>{label}</Text>
      <TextInput
        style={[styles.input, error ? styles.inputError : null]}
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor="#9ca3af"
        autoCapitalize={autoCapitalize ?? 'sentences'}
        keyboardType={keyboardType ?? 'default'}
      />
      {!!error && <Text style={styles.fieldError}>{error}</Text>}
    </View>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#fff' },
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 16, paddingVertical: 12, borderBottomWidth: 1, borderColor: '#f3f4f6',
  },
  backBtn: { width: 40, height: 40, justifyContent: 'center' },
  headerTitle: { fontSize: 17, fontWeight: '700', color: '#111827' },
  scroll: { flex: 1 },
  content: { padding: 20, gap: 16, paddingBottom: 40 },
  uploadZone: {
    height: 120, borderWidth: 2, borderStyle: 'dashed', borderColor: '#d1d5db',
    borderRadius: 16, justifyContent: 'center', alignItems: 'center', gap: 8,
    backgroundColor: '#f9fafb',
  },
  uploadLabel: { fontSize: 13, color: '#6b7280', fontWeight: '600' },
  imageContainer: { borderRadius: 16, overflow: 'hidden', height: 180 },
  preview: { width: '100%', height: '100%' },
  removeImage: {
    position: 'absolute', top: 8, right: 8,
    backgroundColor: '#dc2626', borderRadius: 20, padding: 6,
  },
  fieldWrapper: { gap: 4 },
  label: { fontSize: 13, fontWeight: '600', color: '#374151' },
  input: {
    height: 48, borderWidth: 1.5, borderColor: '#e5e7eb', borderRadius: 12,
    paddingHorizontal: 14, fontSize: 15, color: '#111827', backgroundColor: '#fff',
  },
  inputError: { borderColor: '#dc2626' },
  fieldError: { fontSize: 12, color: '#dc2626' },
  infoBox: {
    backgroundColor: '#eff6ff', borderRadius: 12, padding: 14,
    borderWidth: 1, borderColor: '#bfdbfe',
  },
  infoText: { fontSize: 12, color: '#1e40af', lineHeight: 18 },
  submitBtn: {
    height: 56, backgroundColor: '#6366f1', borderRadius: 16,
    flexDirection: 'row', justifyContent: 'center', alignItems: 'center', gap: 10,
    marginTop: 8,
  },
  submitText: { color: '#fff', fontWeight: '700', fontSize: 16 },
  disabled: { opacity: 0.6 },
});