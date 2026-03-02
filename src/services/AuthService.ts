import type { AuthChangeEvent, Session, User } from '@supabase/supabase-js';

import { supabase } from '@services/SupabaseClient';

export type AuthState = {
  session: Session | null;
  user: User | null;
};

export type AuthListener = (state: AuthState) => void;

export async function signUpWithEmailPassword(params: {
  email: string;
  password: string;
}): Promise<void> {
  const { error } = await supabase.auth.signUp({
    email: params.email,
    password: params.password,
  });

  if (error) {
    throw new Error(error.message);
  }
}

export async function signInWithEmailPassword(params: {
  email: string;
  password: string;
}): Promise<void> {
  const { error } = await supabase.auth.signInWithPassword({
    email: params.email,
    password: params.password,
  });

  if (error) {
    throw new Error(error.message);
  }
}

export async function signOut(): Promise<void> {
  const { error } = await supabase.auth.signOut();
  if (error) {
    throw new Error(error.message);
  }
}

export async function getAuthState(): Promise<AuthState> {
  const { data, error } = await supabase.auth.getSession();
  if (error) {
    throw new Error(error.message);
  }

  return {
    session: data.session,
    user: data.session?.user ?? null,
  };
}

export function onAuthStateChange(listener: AuthListener): () => void {
  const {
    data: { subscription },
  } = supabase.auth.onAuthStateChange((_event: AuthChangeEvent, session: Session | null) => {
    listener({
      session,
      user: session?.user ?? null,
    });
  });

  return () => {
    subscription.unsubscribe();
  };
}
