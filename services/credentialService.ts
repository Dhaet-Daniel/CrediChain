import * as Crypto from 'expo-crypto';
import { supabase } from '@/config/supabase';

// ─── Types ───────────────────────────────────────────────────────────────────

export interface CredentialPayload {
  student_name: string;
  institution: string;
  degree: string;
  issue_date: string;
}

export interface Credential extends CredentialPayload {
  id: string;
  hash: string;
  status: 'active' | 'revoked';
  revocation_reason: string | null;
  metadata: { attachment: string | null } | null;
  created_at: string;
}

export interface Verification {
  id: string;
  credential_id: string | null;
  verifier_name: string;
  timestamp: string;
  result: boolean;
  credentials?: Pick<Credential, 'student_name' | 'degree'>;
}

// ─── Hash Generation ─────────────────────────────────────────────────────────

/**
 * Generates a deterministic SHA-256 hash of the credential data.
 * The hash is derived FROM the data — so it proves the data
 * hasn't changed. This is the core integrity mechanism.
 *
 * Canonical form: fields sorted alphabetically + timestamp salt
 * so two identical degrees issued on different dates produce
 * different hashes (preventing replay attacks).
 */
export async function generateCredentialHash(
  payload: CredentialPayload
): Promise<string> {
  // 1. Sort keys so the hash is order-independent
  const canonical = JSON.stringify({
    degree: payload.degree.trim().toLowerCase(),
    institution: payload.institution.trim().toLowerCase(),
    issue_date: payload.issue_date,
    student_name: payload.student_name.trim().toLowerCase(),
  });

  // 2. Use expo-crypto for a real SHA-256 digest (works on both native + web)
  const digest = await Crypto.digestStringAsync(
    Crypto.CryptoDigestAlgorithm.SHA256,
    canonical
  );

  // 3. Prefix with 0x to signal it's a hex hash (Ethereum-style convention)
  return `0x${digest}`;
}

/**
 * Re-computes the hash from a credential record and compares
 * it to the stored hash. If they differ, the record was tampered with.
 * This is your real tamper-detection mechanism.
 */
export async function verifyDataIntegrity(credential: Credential): Promise<boolean> {
  const recomputed = await generateCredentialHash({
    student_name: credential.student_name,
    institution: credential.institution,
    degree: credential.degree,
    issue_date: credential.issue_date,
  });
  return recomputed === credential.hash;
}

// ─── CRUD ─────────────────────────────────────────────────────────────────────

export async function issueCredential(
  payload: CredentialPayload,
  attachmentUrl: string | null
): Promise<Credential> {
  const hash = await generateCredentialHash(payload);

  // Check for duplicate — same student, same degree, same date
  const { data: existing } = await supabase
    .from('credentials')
    .select('id')
    .eq('hash', hash)
    .single();

  if (existing) {
    throw new Error('A credential with identical data already exists on the ledger.');
  }

  const { data, error } = await supabase
    .from('credentials')
    .insert([{
      ...payload,
      hash,
      status: 'active',
      metadata: { attachment: attachmentUrl },
    }])
    .select()
    .single();

  if (error) throw new Error(`Issuance failed: ${error.message}`);
  return data as Credential;
}

export async function fetchAllCredentials(): Promise<Credential[]> {
  const { data, error } = await supabase
    .from('credentials')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) throw new Error(error.message);
  return (data ?? []) as Credential[];
}

export async function fetchCredentialById(id: string): Promise<Credential | null> {
  const { data, error } = await supabase
    .from('credentials')
    .select('*')
    .eq('id', id)
    .single();

  if (error) return null;
  return data as Credential;
}

export async function verifyCredentialByHash(hash: string): Promise<{
  credential: Credential | null;
  integrityValid: boolean;
  status: 'valid' | 'revoked' | 'not_found' | 'tampered';
}> {
  const { data, error } = await supabase
    .from('credentials')
    .select('*')
    .eq('hash', hash)
    .single();

  if (error || !data) {
    // Log the failed verification attempt
    await supabase.from('verifications').insert([{
      credential_id: null,
      result: false,
      verifier_name: 'Anonymous Verifier',
    }]);
    return { credential: null, integrityValid: false, status: 'not_found' };
  }

  const credential = data as Credential;

  // Re-derive hash from stored fields to check for DB-level tampering
  const integrityValid = await verifyDataIntegrity(credential);

  await supabase.from('verifications').insert([{
    credential_id: credential.id,
    result: integrityValid && credential.status === 'active',
    verifier_name: 'Anonymous Verifier',
  }]);

  if (!integrityValid) return { credential, integrityValid: false, status: 'tampered' };
  if (credential.status === 'revoked') return { credential, integrityValid: true, status: 'revoked' };
  return { credential, integrityValid: true, status: 'valid' };
}

export async function revokeCredential(
  id: string,
  reason: string
): Promise<void> {
  const { error } = await supabase
    .from('credentials')
    .update({ status: 'revoked', revocation_reason: reason })
    .eq('id', id);

  if (error) throw new Error(`Revocation failed: ${error.message}`);
}