import { supabase } from '@/config/supabase';
import { Session, User } from '@supabase/supabase-js';

export interface AuthState {
  session: Session | null;
  user: User | null;
  isIssuer: boolean;
}

/**
 * Sign in with email + password.
 * Issuers are distinguished by a custom JWT claim 'user_role'
 * set via a Supabase database hook (see SQL below).
 */
export async function signIn(
  email: string,
  password: string
): Promise<{ data: AuthState | null; error: string | null }> {
  const { data, error } = await supabase.auth.signInWithPassword({ email, password });

  if (error) return { data: null, error: error.message };

  const isIssuer =
    (data.session?.user?.user_metadata?.user_role === 'issuer') ?? false;

  return {
    data: {
      session: data.session,
      user: data.user,
      isIssuer,
    },
    error: null,
  };
}

export async function signOut(): Promise<void> {
  await supabase.auth.signOut();
}

export async function getSession(): Promise<Session | null> {
  const { data } = await supabase.auth.getSession();
  return data.session;
}

/**
 * Subscribe to auth state changes.
 * Call this once in your root layout.
 */
export function onAuthStateChange(
  callback: (state: AuthState) => void
): { unsubscribe: () => void } {
  const { data } = supabase.auth.onAuthStateChange((_event, session) => {
    callback({
      session,
      user: session?.user ?? null,
      isIssuer: session?.user?.user_metadata?.user_role === 'issuer',
    });
  });
  return { unsubscribe: () => data.subscription.unsubscribe() };
}