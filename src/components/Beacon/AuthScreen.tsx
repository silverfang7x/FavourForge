import React, { useMemo, useRef, useState } from 'react';
import {
  Alert,
  Animated,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';

import { signInWithEmailPassword, signUpWithEmailPassword } from '@services/AuthService';

type Mode = 'login' | 'signup';

function isValidEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim());
}

export function AuthScreen() {
  const [mode, setMode] = useState<Mode>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const btnScale = useRef(new Animated.Value(1)).current;

  const canSubmit = useMemo(() => {
    return isValidEmail(email) && password.length >= 8 && !submitting;
  }, [email, password, submitting]);

  async function onSubmit() {
    setSubmitting(true);
    try {
      const normalizedEmail = email.trim().toLowerCase();
      if (mode === 'signup') {
        await signUpWithEmailPassword({ email: normalizedEmail, password });
        Alert.alert('Check your email', 'Confirm your email to finish creating your account.');
      } else {
        await signInWithEmailPassword({ email: normalizedEmail, password });
      }
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Unknown error';
      Alert.alert('Auth failed', message);
    } finally {
      setSubmitting(false);
    }
  }

  function onPressIn() {
    Animated.spring(btnScale, { toValue: 0.96, useNativeDriver: true }).start();
  }

  function onPressOut() {
    Animated.spring(btnScale, { toValue: 1, useNativeDriver: true }).start();
  }

  return (
    <KeyboardAvoidingView
      style={styles.root}
      behavior={Platform.select({ ios: 'padding', android: undefined })}
    >
      <ScrollView
        contentContainerStyle={styles.scroll}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        {/* ── Hero ── */}
        <View style={styles.hero}>
          <View style={styles.logoCircle}>
            <Text style={styles.logoEmoji}>⚡</Text>
          </View>
          <Text style={styles.heroTitle}>FavorForge</Text>
          <Text style={styles.heroSub}>Earn quick cash. Help your community.</Text>
        </View>

        {/* ── Card ── */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>
            {mode === 'signup' ? '👋 Create Account' : '🔑 Welcome Back'}
          </Text>

          <Text style={styles.label}>Email address</Text>
          <View style={styles.inputWrap}>
            <Text style={styles.inputIcon}>✉️</Text>
            <TextInput
              style={styles.input}
              value={email}
              onChangeText={setEmail}
              autoCapitalize="none"
              keyboardType="email-address"
              textContentType="emailAddress"
              placeholderTextColor="#9CA3AF"
              placeholder="you@email.com"
              accessibilityLabel="Email"
            />
          </View>

          <Text style={styles.label}>Password</Text>
          <View style={styles.inputWrap}>
            <Text style={styles.inputIcon}>🔒</Text>
            <TextInput
              style={styles.input}
              value={password}
              onChangeText={setPassword}
              secureTextEntry
              textContentType={mode === 'signup' ? 'newPassword' : 'password'}
              placeholderTextColor="#9CA3AF"
              placeholder="Min 8 characters"
              accessibilityLabel="Password"
            />
          </View>

          <Animated.View style={{ transform: [{ scale: btnScale }] }}>
            <Pressable
              style={[styles.btn, canSubmit ? styles.btnEnabled : styles.btnDisabled]}
              onPress={onSubmit}
              onPressIn={onPressIn}
              onPressOut={onPressOut}
              disabled={!canSubmit}
              accessibilityRole="button"
            >
              <Text style={styles.btnText}>
                {submitting ? '⏳ Please wait…' : mode === 'signup' ? '🚀 Sign Up' : '⚡ Log In'}
              </Text>
            </Pressable>
          </Animated.View>

          <Pressable
            onPress={() => setMode((m) => (m === 'login' ? 'signup' : 'login'))}
            accessibilityRole="button"
          >
            <Text style={styles.switchText}>
              {mode === 'signup'
                ? 'Already have an account? Log in →'
                : "Don't have an account? Sign up →"}
            </Text>
          </Pressable>

          <Text style={styles.help}>🔐 Password must be at least 8 characters</Text>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: '#F8F9FA',
  },
  scroll: {
    flexGrow: 1,
    justifyContent: 'center',
    paddingHorizontal: 20,
    paddingVertical: 48,
  },
  hero: {
    alignItems: 'center',
    marginBottom: 32,
  },
  logoCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#EDE9FE',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
    shadowColor: '#6C63FF',
    shadowOpacity: 0.2,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 4 },
    elevation: 6,
  },
  logoEmoji: {
    fontSize: 38,
  },
  heroTitle: {
    fontSize: 34,
    fontWeight: '900',
    color: '#1A1A2E',
    letterSpacing: -0.5,
  },
  heroSub: {
    marginTop: 6,
    fontSize: 14,
    fontWeight: '600',
    color: '#6C63FF',
    letterSpacing: 0.2,
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    padding: 24,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    shadowColor: '#6C63FF',
    shadowOpacity: 0.08,
    shadowRadius: 20,
    shadowOffset: { width: 0, height: 6 },
    elevation: 6,
    gap: 4,
  },
  cardTitle: {
    fontSize: 22,
    fontWeight: '900',
    color: '#1A1A2E',
    marginBottom: 8,
  },
  label: {
    fontSize: 12,
    fontWeight: '700',
    color: '#6B7280',
    letterSpacing: 0.5,
    textTransform: 'uppercase',
    marginTop: 12,
    marginBottom: 6,
  },
  inputWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8F9FA',
    borderRadius: 14,
    borderWidth: 1.5,
    borderColor: '#E5E7EB',
    paddingHorizontal: 14,
    paddingVertical: 2,
    gap: 10,
  },
  inputIcon: {
    fontSize: 16,
  },
  input: {
    flex: 1,
    paddingVertical: 14,
    fontSize: 15,
    fontWeight: '600',
    color: '#1A1A2E',
  },
  btn: {
    marginTop: 20,
    paddingVertical: 16,
    borderRadius: 16,
    alignItems: 'center',
  },
  btnEnabled: {
    backgroundColor: '#6C63FF',
    shadowColor: '#6C63FF',
    shadowOpacity: 0.4,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 6 },
    elevation: 8,
  },
  btnDisabled: {
    backgroundColor: '#E5E7EB',
  },
  btnText: {
    color: '#ffffff',
    fontWeight: '900',
    fontSize: 16,
    letterSpacing: 0.3,
  },
  switchText: {
    marginTop: 16,
    color: '#6C63FF',
    fontWeight: '700',
    textAlign: 'center',
    fontSize: 14,
  },
  help: {
    marginTop: 10,
    fontSize: 12,
    color: '#9CA3AF',
    textAlign: 'center',
  },
});
