import React, { useMemo, useRef, useState } from 'react';
import {
  Alert,
  Animated,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { BeaconMap } from '@components/Map/BeaconMap';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import type { User } from '@supabase/supabase-js';
import { Ionicons } from '@expo/vector-icons';

import { AuthScreen } from '@components/Beacon/AuthScreen';
import { ChatScreen } from '@components/Chat/ChatScreen';
import { EditProfileScreen } from '@screens/EditProfileScreen';
import { supabase } from '@services/SupabaseClient';

// ─── Theme ────────────────────────────────────
const T = {
  primary: '#6C63FF',
  primaryLight: '#EDE9FE',
  purple: '#8B5CF6',
  bg: '#F8F9FA',
  card: '#FFFFFF',
  text: '#1A1A2E',
  muted: '#6B7280',
  border: '#E5E7EB',
  danger: '#EF4444',
  amber: '#F59E0B',
  green: '#10B981',
};

type TabParamList = {
  Map: { user: User };
  Inbox: { user: User };
  Profile: { user: User };
};

export type RootStackParamList = {
  Auth: undefined;
  Home: { user: User };
  Chat: { user: User; beaconId: string };
  EditProfile: undefined;
};

// ─────────────────────────────────────────────
// INBOX SCREEN
// ─────────────────────────────────────────────
const MOCK_THREADS = [
  {
    id: '1',
    name: 'Alex M.',
    preview: 'Hey, I can help with that! When do you need it done?',
    time: '2m ago',
    unread: 3,
    avatar: '🧑‍🔧',
  },
  {
    id: '2',
    name: 'Sara K.',
    preview: 'Just finished the delivery. Please confirm receipt 🙏',
    time: '14m ago',
    unread: 1,
    avatar: '👩‍💼',
  },
  {
    id: '3',
    name: 'Jordan P.',
    preview: 'I accepted your beacon. ETA 10 minutes.',
    time: '1h ago',
    unread: 0,
    avatar: '🧑‍🎨',
  },
  {
    id: '4',
    name: 'Morgan T.',
    preview: 'Can you provide more details about the task?',
    time: '3h ago',
    unread: 0,
    avatar: '🧑‍💻',
  },
  {
    id: '5',
    name: 'FavorForge',
    preview: '⚡ You earned ₹2,000 from completing "Move Box"',
    time: 'Yesterday',
    unread: 0,
    avatar: '⚡',
    beaconId: 'system',
  },
];

function InboxScreen({ navigation }: { navigation: any }) {
  return (
    <View style={s.screen}>
      <View style={s.screenHeader}>
        <Text style={s.screenTitle}>📬 Inbox</Text>
        <View style={s.headerBadge}>
          <Text style={s.headerBadgeText}>4 unread</Text>
        </View>
      </View>
      <ScrollView showsVerticalScrollIndicator={false}>
        {MOCK_THREADS.map((t) => (
          <TouchableOpacity
            key={t.id}
            style={s.threadRow}
            activeOpacity={0.75}
            onPress={() =>
              navigation.navigate('Chat', {
                user: undefined,
                beaconId: (t as any).beaconId ?? t.id,
              })
            }
          >
            <View style={s.avatarCircle}>
              <Text style={s.avatarEmoji}>{t.avatar}</Text>
            </View>
            <View style={s.threadBody}>
              <View style={s.threadTop}>
                <Text style={s.threadName}>{t.name}</Text>
                <Text style={s.threadTime}>{t.time}</Text>
              </View>
              <Text style={s.threadPreview} numberOfLines={1}>
                {t.preview}
              </Text>
            </View>
            {t.unread > 0 && (
              <View style={s.unreadBadge}>
                <Text style={s.unreadText}>{t.unread}</Text>
              </View>
            )}
          </TouchableOpacity>
        ))}
        <View style={s.listFooter} />
      </ScrollView>
    </View>
  );
}

// ─────────────────────────────────────────────
// PROFILE SCREEN
// ─────────────────────────────────────────────
function ProfileScreen({ navigation }: { navigation: any }) {
  const [notificationsOn, setNotificationsOn] = useState(true);
  const [locationOn, setLocationOn] = useState(true);

  async function handleSignOut() {
    Alert.alert('Sign Out', 'Are you sure you want to sign out?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Sign Out',
        style: 'destructive',
        onPress: async () => {
          try {
            await supabase.auth.signOut();
          } catch {
            Alert.alert('Error', 'Failed to sign out. Please try again.');
          }
        },
      },
    ]);
  }

  return (
    <View style={s.screen}>
      {/* Hero */}
      <View style={s.profileHero}>
        <View style={s.profileAvatar}>
          <Text style={s.profileAvatarEmoji}>🧑‍💻</Text>
        </View>
        <Text style={s.profileName}>Your Profile</Text>
        <Text style={s.profileHandle}>@favorforger</Text>

        {/* Stats */}
        <View style={s.statsRow}>
          <View style={s.statBox}>
            <Text style={s.statValue}>12</Text>
            <Text style={s.statLabel}>Jobs Done</Text>
          </View>
          <View style={s.statDivider} />
          <View style={s.statBox}>
            <Text style={s.statValue}>$240</Text>
            <Text style={s.statLabel}>Earned</Text>
          </View>
          <View style={s.statDivider} />
          <View style={s.statBox}>
            <Text style={s.statValue}>4.9 ⭐</Text>
            <Text style={s.statLabel}>Rating</Text>
          </View>
        </View>
      </View>

      <ScrollView style={s.settingsList} showsVerticalScrollIndicator={false}>
        {/* Toggle rows */}
        <View style={s.settingsSection}>
          <Text style={s.settingsSectionTitle}>PREFERENCES</Text>
          <View style={s.settingsRow}>
            <Text style={s.settingsIcon}>🔔</Text>
            <Text style={s.settingsLabel}>Notifications</Text>
            <Switch
              value={notificationsOn}
              onValueChange={setNotificationsOn}
              trackColor={{ false: T.border, true: T.primaryLight }}
              thumbColor={notificationsOn ? T.primary : '#D1D5DB'}
            />
          </View>
          <View style={s.settingsRow}>
            <Text style={s.settingsIcon}>📍</Text>
            <Text style={s.settingsLabel}>Location Access</Text>
            <Switch
              value={locationOn}
              onValueChange={setLocationOn}
              trackColor={{ false: T.border, true: T.primaryLight }}
              thumbColor={locationOn ? T.primary : '#D1D5DB'}
            />
          </View>
        </View>

        {/* Regular rows */}
        <View style={s.settingsSection}>
          <Text style={s.settingsSectionTitle}>ACCOUNT</Text>
          <TouchableOpacity
            style={s.settingsRow}
            activeOpacity={0.7}
            onPress={() => navigation.navigate('EditProfile')}
          >
            <Text style={s.settingsIcon}>👤</Text>
            <Text style={s.settingsLabel}>Account Settings</Text>
            <Text style={s.settingsChevron}>›</Text>
          </TouchableOpacity>
          {[
            { icon: '💳', label: 'Payment Methods' },
            { icon: '⭐', label: 'My Reviews' },
            { icon: '❓', label: 'Help & Support' },
          ].map((row) => (
            <TouchableOpacity key={row.label} style={s.settingsRow} activeOpacity={0.7}>
              <Text style={s.settingsIcon}>{row.icon}</Text>
              <Text style={s.settingsLabel}>{row.label}</Text>
              <Text style={s.settingsChevron}>›</Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Sign Out */}
        <TouchableOpacity style={s.signOutBtn} onPress={handleSignOut} activeOpacity={0.8}>
          <Text style={s.signOutText}>🚪 Sign Out</Text>
        </TouchableOpacity>

        <View style={s.listFooter} />
      </ScrollView>
    </View>
  );
}

// ─────────────────────────────────────────────
// NAVIGATION
// ─────────────────────────────────────────────
const Stack = createNativeStackNavigator<RootStackParamList>();
const Tab = createBottomTabNavigator<TabParamList>();

function AuthedTabs({ route }: any) {
  const user = route?.params?.user;
  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
        tabBarShowLabel: true,
        tabBarActiveTintColor: T.primary,
        tabBarInactiveTintColor: '#9CA3AF',
        tabBarStyle: {
          position: 'absolute',
          bottom: 16,
          left: 16,
          right: 16,
          height: 64,
          borderRadius: 24,
          backgroundColor: '#FFFFFF',
          borderTopWidth: 0,
          borderWidth: 1,
          borderColor: '#EDE9FE',
          shadowColor: '#6C63FF',
          shadowOpacity: 0.15,
          shadowRadius: 16,
          shadowOffset: { width: 0, height: 8 },
          elevation: 12,
          paddingBottom: 8,
          paddingTop: 6,
        },
        tabBarLabelStyle: {
          fontSize: 10,
          fontWeight: '700',
          letterSpacing: 0.3,
        },
      }}
    >
      <Tab.Screen
        name="Map"
        options={{
          tabBarIcon: ({ color, size }) => <Ionicons name="map" size={size} color={color} />,
        }}
      >
        {() => <BeaconMap userId={user?.id} />}
      </Tab.Screen>
      <Tab.Screen
        name="Inbox"
        component={InboxScreen}
        options={{
          tabBarIcon: ({ color, size }) => <Ionicons name="mail" size={size} color={color} />,
        }}
      />
      <Tab.Screen
        name="Profile"
        component={ProfileScreen}
        options={{
          tabBarIcon: ({ color, size }) => <Ionicons name="person" size={size} color={color} />,
        }}
      />
    </Tab.Navigator>
  );
}

type AppNavigatorProps = {
  user: User | null;
};

export function AppNavigator({ user }: AppNavigatorProps) {
  return (
    <NavigationContainer>
      <Stack.Navigator>
        {user ? (
          <>
            <Stack.Screen
              name="Home"
              component={AuthedTabs}
              initialParams={{ user }}
              options={{ headerShown: false }}
            />
            <Stack.Screen name="Chat" component={ChatScreen} options={{ headerShown: false }} />
            <Stack.Screen
              name="EditProfile"
              component={EditProfileScreen}
              options={{ headerShown: false }}
            />
          </>
        ) : (
          <Stack.Screen name="Auth" component={AuthScreen} options={{ headerShown: false }} />
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
}

// ─────────────────────────────────────────────
// STYLES
// ─────────────────────────────────────────────
const s = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: T.bg,
  },
  screenHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 60,
    paddingBottom: 16,
    backgroundColor: T.card,
    borderBottomWidth: 1,
    borderBottomColor: T.border,
  },
  screenTitle: {
    fontSize: 24,
    fontWeight: '900',
    color: T.text,
  },
  headerBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 999,
    backgroundColor: T.primaryLight,
  },
  headerBadgeText: {
    fontSize: 11,
    fontWeight: '800',
    color: T.primary,
  },
  // Inbox
  threadRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 14,
    backgroundColor: T.card,
    borderBottomWidth: 1,
    borderBottomColor: T.border,
    gap: 14,
  },
  avatarCircle: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: T.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarEmoji: {
    fontSize: 22,
  },
  threadBody: {
    flex: 1,
    gap: 4,
  },
  threadTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  threadName: {
    fontSize: 14,
    fontWeight: '800',
    color: T.text,
  },
  threadTime: {
    fontSize: 11,
    fontWeight: '600',
    color: T.muted,
  },
  threadPreview: {
    fontSize: 13,
    fontWeight: '500',
    color: T.muted,
  },
  unreadBadge: {
    minWidth: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: T.primary,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 4,
  },
  unreadText: {
    fontSize: 11,
    fontWeight: '900',
    color: '#fff',
  },
  listFooter: {
    height: 100,
  },
  // Profile
  profileHero: {
    alignItems: 'center',
    paddingTop: 60,
    paddingBottom: 24,
    paddingHorizontal: 20,
    borderBottomWidth: 1,
    borderBottomColor: T.border,
    backgroundColor: T.card,
  },
  profileAvatar: {
    width: 88,
    height: 88,
    borderRadius: 44,
    backgroundColor: T.primaryLight,
    borderWidth: 3,
    borderColor: T.primary,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
    shadowColor: T.primary,
    shadowOpacity: 0.2,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 4 },
    elevation: 6,
  },
  profileAvatarEmoji: {
    fontSize: 40,
  },
  profileName: {
    fontSize: 22,
    fontWeight: '900',
    color: T.text,
  },
  profileHandle: {
    marginTop: 4,
    fontSize: 13,
    fontWeight: '600',
    color: T.primary,
    marginBottom: 20,
  },
  statsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: T.primaryLight,
    borderRadius: 18,
    paddingVertical: 14,
    paddingHorizontal: 10,
    width: '100%',
  },
  statBox: {
    flex: 1,
    alignItems: 'center',
    gap: 4,
  },
  statValue: {
    fontSize: 18,
    fontWeight: '900',
    color: T.primary,
  },
  statLabel: {
    fontSize: 11,
    fontWeight: '600',
    color: T.muted,
  },
  statDivider: {
    width: 1,
    height: 30,
    backgroundColor: '#C4B5FD',
  },
  settingsList: {
    flex: 1,
  },
  settingsSection: {
    marginTop: 20,
    marginHorizontal: 16,
    backgroundColor: T.card,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: T.border,
    overflow: 'hidden',
  },
  settingsSectionTitle: {
    fontSize: 11,
    fontWeight: '800',
    color: T.muted,
    letterSpacing: 0.8,
    paddingHorizontal: 16,
    paddingTop: 14,
    paddingBottom: 6,
  },
  settingsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderTopWidth: 1,
    borderTopColor: T.border,
    gap: 14,
  },
  settingsIcon: {
    fontSize: 20,
    width: 28,
    textAlign: 'center',
  },
  settingsLabel: {
    flex: 1,
    fontSize: 15,
    fontWeight: '700',
    color: T.text,
  },
  settingsDanger: {
    color: T.danger,
  },
  settingsChevron: {
    fontSize: 20,
    color: '#D1D5DB',
    fontWeight: '900',
  },
  signOutBtn: {
    marginHorizontal: 16,
    marginTop: 20,
    paddingVertical: 16,
    borderRadius: 16,
    backgroundColor: '#FEF2F2',
    borderWidth: 1,
    borderColor: '#FECACA',
    alignItems: 'center',
  },
  signOutText: {
    fontSize: 15,
    fontWeight: '800',
    color: T.danger,
  },
});
