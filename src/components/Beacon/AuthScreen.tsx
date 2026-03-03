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

const FEATURE_BADGES = ['⚡ Quick Cash', '📍 Local Jobs', '🤝 Community', '💰 Earn ₹₹₹'];

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
      behavior={Platform.select({ ios: 'padding', android: 'height' })}
      keyboardVerticalOffset={Platform.OS === 'android' ? 0 : 0}
    >
      <ScrollView
        contentContainerStyle={styles.scroll}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        {/* ── Hero ── */}
        <View style={styles.hero}>
          <View style={styles.logoRing}>
            <View style={styles.logoCircle}>
              <Text style={styles.logoEmoji}>⚡</Text>
            </View>
          </View>
          <Text style={styles.heroTitle}>FavorForge</Text>
          <Text style={styles.heroSub}>Earn quick cash. Help your community.</Text>

          {/* Feature badges */}
          <View style={styles.badgeRow}>
            {FEATURE_BADGES.map((b) => (
              <View key={b} style={styles.badge}>
                <Text style={styles.badgeText}>{b}</Text>
              </View>
            ))}
          </View>
        </View>

        {/* ── Card ── */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>
            {mode === 'signup' ? '👋 Create Account' : '🔑 Welcome Back'}
          </Text>
          <Text style={styles.cardSubtitle}>
            {mode === 'signup'
              ? 'Join thousands earning locally'
              : 'Sign in to your FavorForge account'}
          </Text>

          {/* Email */}
          <View style={styles.inputGroup}>
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

          {/* Password */}
          <View style={styles.inputGroup}>
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

          {/* Submit */}
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
                {submitting ? '⏳ Please wait…' : mode === 'signup' ? '🚀 Create Account' : '⚡ Sign In'}
              </Text>
            </Pressable>
          </Animated.View>

          {/* Divider */}
          <View style={styles.divider}>
            <View style={styles.dividerLine} />
            <Text style={styles.dividerText}>or</Text>
            <View style={styles.dividerLine} />
          </View>

          {/* Mode switch */}
          <Pressable
            onPress={() => setMode((m) => (m === 'login' ? 'signup' : 'login'))}
            style={styles.switchBtn}
            accessibilityRole="button"
          >
            <Text style={styles.switchText}>
              {mode === 'signup'
                ? 'Already have an account? '
                : "Don't have an account? "}
              <Text style={styles.switchTextHighlight}>
                {mode === 'signup' ? 'Log In →' : 'Sign Up →'}
              </Text>
            </Text>
          </Pressable>

          <Text style={styles.help}>🔐 Your data is encrypted & safe</Text>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: '#F0EDFF',
  },
  scroll: {
    flexGrow: 1,
    justifyContent: 'center',
    paddingHorizontal: 20,
    paddingVertical: 48,
  },
  hero: {
    alignItems: 'center',
    marginBottom: 28,
  },
  logoRing: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: 'rgba(108,99,255,0.12)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  logoCircle: {
    width: 76,
    height: 76,
    borderRadius: 38,
    backgroundColor: '#6C63FF',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#6C63FF',
    shadowOpacity: 0.45,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 8 },
    elevation: 10,
  },
  logoEmoji: {
    fontSize: 36,
  },
  heroTitle: {
    fontSize: 36,
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
  badgeRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: 8,
    marginTop: 16,
  },
  badge: {
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 999,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#C4B5FD',
  },
  badgeText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#6C63FF',
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    padding: 24,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    shadowColor: '#6C63FF',
    shadowOpacity: 0.1,
    shadowRadius: 20,
    shadowOffset: { width: 0, height: 8 },
    elevation: 8,
    gap: 0,
  },
  cardTitle: {
    fontSize: 22,
    fontWeight: '900',
    color: '#1A1A2E',
    marginBottom: 4,
  },
  cardSubtitle: {
    fontSize: 13,
    fontWeight: '500',
    color: '#6B7280',
    marginBottom: 20,
  },
  inputGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8F9FA',
    borderRadius: 15,
    borderWidth: 1.5,
    borderColor: '#E5E7EB',
    paddingHorizontal: 14,
    gap: 10,
    marginBottom: 12,
  },
  inputGroupFocused: {
    borderColor: '#6C63FF',
    backgroundColor: '#FAFAFE',
    shadowColor: '#6C63FF',
    shadowOpacity: 0.12,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 3 },
    elevation: 4,
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
    marginTop: 8,
    paddingVertical: 16,
    borderRadius: 15,
    alignItems: 'center',
  },
  btnEnabled: {
    backgroundColor: '#6C63FF',
    shadowColor: '#6C63FF',
    shadowOpacity: 0.4,
    shadowRadius: 14,
    shadowOffset: { width: 0, height: 7 },
    elevation: 10,
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
  divider: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginVertical: 16,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: '#E5E7EB',
  },
  dividerText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#9CA3AF',
  },
  switchBtn: {
    alignItems: 'center',
    paddingVertical: 4,
  },
  switchText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#6B7280',
    textAlign: 'center',
  },
  switchTextHighlight: {
    color: '#6C63FF',
    fontWeight: '800',
  },
  help: {
    marginTop: 14,
    fontSize: 12,
    color: '#9CA3AF',
    textAlign: 'center',
  },
});
