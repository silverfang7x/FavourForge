import React from 'react';
import { Alert, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import type { User } from '@supabase/supabase-js';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';

import { Ionicons } from '@expo/vector-icons'; // Ensure you have the correct icon set
import { BeaconMap } from '@components/Map/BeaconMap';
import { signOut } from '@services/AuthService';
import type { RootStackParamList } from '../../navigation';

type HomeScreenProps = NativeStackScreenProps<RootStackParamList, 'Home'>;

export function HomeScreen({ route, navigation }: HomeScreenProps) {
  const user: User | null = route.params.user; // Ensure user can be null

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>FavorForge</Text>
        <TouchableOpacity
          accessibilityRole="button"
          onPress={() => {
            signOut().catch((err: unknown) => {
              const message = err instanceof Error ? err.message : 'Unknown error';
              Alert.alert('Sign out failed', message);
            });
          }}
        >
          <Text style={styles.link}>Sign out</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.body}>
        {user?.id && (
          <BeaconMap
            userId={user.id}
            onOpenChat={(beaconId) => navigation.navigate('Chat', { user, beaconId })}
          />
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    paddingTop: 56,
    paddingHorizontal: 16,
    paddingBottom: 12,
    backgroundColor: 'white',
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  title: {
    fontSize: 18,
    fontWeight: '700',
  },
  link: {
    color: '#111827',
    fontWeight: '700',
  },
  body: {
    flex: 1,
  },
});
