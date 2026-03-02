import React, { useEffect, useState } from 'react';
import { Alert, StyleSheet, View } from 'react-native';
import type { User } from '@supabase/supabase-js';

import { getAuthState, onAuthStateChange } from '@services/AuthService';
import { AppNavigator } from '../navigation';
import { LoadingScreen } from '@components/Beacon/LoadingScreen';

export function AuthGate() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [phase, setPhase] = useState<'auth_bootstrap' | 'auth_listener'>('auth_bootstrap');

  useEffect(() => {
    let mounted = true;
    let timeoutId: ReturnType<typeof setTimeout> | null = null;

    const clearStartupTimeout = () => {
      if (timeoutId) {
        clearTimeout(timeoutId);
        timeoutId = null;
      }
    };

    const startTimeout = () => {
      clearStartupTimeout();
      timeoutId = setTimeout(() => {
        if (!mounted) return;
        setError(
          'App startup timed out. This is usually caused by a network issue or an auth/session problem.',
        );
        setLoading(false);
      }, 15000);
    };

    startTimeout();

    getAuthState()
      .then((state) => {
        if (!mounted) return;
        setUser(state.user);
      })
      .catch((err: unknown) => {
        const message = err instanceof Error ? err.message : 'Unknown error';
        setError(`Auth bootstrap failed: ${message}`);
        Alert.alert('Auth error', message);
      })
      .finally(() => {
        if (!mounted) return;
        clearStartupTimeout();
        setLoading(false);
      });

    let unsubscribe: (() => void) | null = null;
    try {
      setPhase('auth_listener');
      unsubscribe = onAuthStateChange((state) => {
        setUser(state.user);
      });
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Unknown error';
      setError(`Auth listener failed: ${message}`);
    }

    return () => {
      mounted = false;
      clearStartupTimeout();
      if (unsubscribe) unsubscribe();
    };
  }, []);

  if (loading) {
    return (
      <View style={styles.center}>
        <LoadingScreen title="Please wait" detail={`Starting app (${phase})…`} error={error} />
      </View>
    );
  }

  if (error) {
    return (
      <LoadingScreen
        title="Startup error"
        detail={`Last phase: ${phase}`}
        error={error}
        onRetry={() => {
          setLoading(true);
          setError(null);
          setPhase('auth_bootstrap');
        }}
      />
    );
  }

  return <AppNavigator user={user} />;
}

const styles = StyleSheet.create({
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
