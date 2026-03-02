import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';

type LoadingScreenProps = {
  title?: string;
  detail?: string;
  error?: string | null;
  onRetry?: () => void;
};

export function LoadingScreen({
  title = 'Please wait',
  detail,
  error,
  onRetry,
}: LoadingScreenProps) {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>{title}</Text>
      {detail ? <Text style={styles.detail}>{detail}</Text> : null}
      {error ? <Text style={styles.error}>{error}</Text> : null}
      {onRetry ? (
        <TouchableOpacity accessibilityRole="button" style={styles.button} onPress={onRetry}>
          <Text style={styles.buttonText}>Retry</Text>
        </TouchableOpacity>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'white',
  },
  title: {
    fontSize: 18,
    fontWeight: '800',
    color: '#111827',
    textAlign: 'center',
  },
  detail: {
    marginTop: 8,
    fontSize: 13,
    color: '#6b7280',
    textAlign: 'center',
  },
  error: {
    marginTop: 10,
    fontSize: 13,
    color: '#b91c1c',
    textAlign: 'center',
  },
  button: {
    marginTop: 14,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 12,
    backgroundColor: '#111827',
  },
  buttonText: {
    color: 'white',
    fontWeight: '800',
  },
});
