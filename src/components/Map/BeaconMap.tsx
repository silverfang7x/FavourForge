import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  Alert,
  Dimensions,
  Keyboard,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import MapView, { LatLng, Marker, Region } from 'react-native-maps';
import * as Location from 'expo-location';
import BottomSheet, { BottomSheetBackdrop, BottomSheetTextInput } from '@gorhom/bottom-sheet';

import { supabase } from '@services/SupabaseClient';
import type { BeaconModel } from '@models/BeaconModel';
import { acceptBeacon, listNearbyBeacons } from '@services/BeaconService';

type BeaconMapProps = {
  userId: string;
  onOpenChat?: (beaconId: string) => void;
};

type CreateBeaconInput = {
  description: string;
  lat: number;
  lon: number;
};

async function requestLocationPermission(): Promise<boolean> {
  const { status } = await Location.requestForegroundPermissionsAsync();
  return status === Location.PermissionStatus.GRANTED;
}

export function BeaconMap({ userId, onOpenChat }: BeaconMapProps) {
  const [region, setRegion] = useState<Region | null>(null);
  const [locationError, setLocationError] = useState<string | null>(null);
  const [dropping, setDropping] = useState(false);
  const [pin, setPin] = useState<LatLng | null>(null);
  const [description, setDescription] = useState('');
  const [isCreating, setIsCreating] = useState(false);
  const [nearby, setNearby] = useState<BeaconModel[]>([]);
  const [isLoadingNearby, setIsLoadingNearby] = useState(false);
  const [reward, setReward] = useState('');
  const [selectedBeacon, setSelectedBeacon] = useState<BeaconModel | null>(null);
  const [isModalVisible, setIsModalVisible] = useState(false);

  const mapRef = useRef<MapView | null>(null);
  const sheetRef = useRef<BottomSheet | null>(null);

  const sheetSnapPoints = useMemo(() => ['20%', '62%'], []);

  useEffect(() => {
    let mounted = true;

    (async () => {
      setLocationError(null);

      const granted = await requestLocationPermission();
      if (!granted) {
        setLocationError('Please enable location services (permission denied).');
        return;
      }

      const servicesEnabled = await Location.hasServicesEnabledAsync();
      if (!servicesEnabled) {
        setLocationError('Please enable location services (GPS is off).');
        return;
      }

      const pos = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced });
      if (!mounted) return;

      setRegion({
        latitude: pos.coords.latitude,
        longitude: pos.coords.longitude,
        latitudeDelta: 0.01,
        longitudeDelta: 0.01,
      });
    })().catch((err: unknown) => {
      const message = err instanceof Error ? err.message : 'Unknown error';
      setLocationError(`Location error: ${message}`);
    });

    return () => {
      mounted = false;
    };
  }, []);

  const refreshNearby = useCallback(async () => {
    if (!region) return;
    setIsLoadingNearby(true);
    try {
      const rows = await listNearbyBeacons({
        lat: region.latitude,
        lon: region.longitude,
        radiusM: 1500,
        limit: 200,
      });
      setNearby(rows.filter((b) => !b.accepted));
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Unknown error';
      Alert.alert('Nearby beacons failed', message);
    } finally {
      setIsLoadingNearby(false);
    }
  }, [region]);

  useEffect(() => {
    refreshNearby().catch(() => undefined);
  }, [refreshNearby]);

  const canCreate = useMemo(() => {
    return Boolean(pin) && description.trim().length > 0 && !isCreating;
  }, [pin, description, isCreating]);

  const onLongPress = useCallback((coord: LatLng) => {
    setPin(coord);
    setDropping(true);
    sheetRef.current?.snapToIndex(1);
  }, []);

  const openCreateSheet = useCallback(() => {
    setIsModalVisible(true);
  }, []);

  const closeCreateSheet = useCallback(() => {
    Keyboard.dismiss();
    setIsModalVisible(false);
    setDropping(false);
    setPin(null);
    setDescription('');
    setReward('');
  }, []);

  const createBeacon = useCallback(
    async (input: CreateBeaconInput) => {
      const { data, error } = await supabase
        .from('beacons')
        .insert({
          user_id: userId,
          description: input.description,
          lat: input.lat,
          lon: input.lon,
        })
        .select('id')
        .single();

      if (error) {
        throw new Error(error.message);
      }

      if (!data?.id) {
        throw new Error('Beacon created but no id returned');
      }

      return data.id as string;
    },
    [userId],
  );

  const onCreate = useCallback(async () => {
    if (!pin) return;

    setIsCreating(true);
    try {
      const beaconId = await createBeacon({
        description: description.trim(),
        lat: pin.latitude,
        lon: pin.longitude,
      });

      closeCreateSheet();

      if (onOpenChat) {
        Alert.alert('Beacon created', 'Start chatting now?', [
          { text: 'Later', style: 'cancel' },
          { text: 'Open chat', onPress: () => onOpenChat(beaconId) },
        ]);
      } else {
        Alert.alert('Beacon created', 'Your beacon is live for nearby users.');
      }

      refreshNearby().catch(() => undefined);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Unknown error';
      Alert.alert('Create failed', message);
    } finally {
      setIsCreating(false);
    }
  }, [pin, description, createBeacon, onOpenChat, refreshNearby, closeCreateSheet]);

  const onPressBeacon = useCallback(
    (beacon: BeaconModel) => {
      if (beacon.user_id === userId) {
        Alert.alert('Your beacon', 'This is your own beacon.');
        return;
      }
      setSelectedBeacon(beacon);
    },
    [userId],
  );

  const acceptSelectedBeacon = useCallback(() => {
    if (!selectedBeacon || !region) return;
    acceptBeacon({
      beaconId: selectedBeacon.id,
      lat: region.latitude,
      lon: region.longitude,
      maxDistanceM: 150,
    })
      .then(() => {
        setNearby((prev) => prev.filter((b) => b.id !== selectedBeacon.id));
        setSelectedBeacon(null);
        if (onOpenChat) onOpenChat(selectedBeacon.id);
      })
      .catch((err: unknown) => {
        const message = err instanceof Error ? err.message : 'Unknown error';
        Alert.alert('Accept failed', message);
      });
  }, [selectedBeacon, region, onOpenChat]);

  if (locationError) {
    return (
      <View style={styles.center}>
        <Text style={styles.errorTitle}>Location required</Text>
        <Text style={styles.errorText}>{locationError}</Text>
      </View>
    );
  }

  if (!region) {
    return (
      <View style={styles.center}>
        <Text>Loading map…</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <MapView
        ref={(r) => {
          mapRef.current = r;
        }}
        style={styles.map}
        initialRegion={region}
        onLongPress={(e) => onLongPress(e.nativeEvent.coordinate)}
        showsUserLocation
        showsMyLocationButton
      >
        {nearby.map((b) => {
          const isOwn = b.user_id === userId;
          const isHighValue = parseFloat((b as any).reward ?? '0') >= 50;
          const markerStyle = isOwn
            ? styles.markerMine
            : isHighValue
              ? styles.markerHigh
              : styles.markerOther;
          const stemStyle = isOwn
            ? styles.markerStemMine
            : isHighValue
              ? styles.markerStemHigh
              : styles.markerStemOther;
          return (
            <Marker
              key={b.id}
              coordinate={{ latitude: b.lat, longitude: b.lon }}
              title={b.description}
              description={(b as any).reward ? `💰 $${(b as any).reward}` : 'Tap to view job'}
              onPress={() => onPressBeacon(b)}
            />
          );
        })}
        {pin ? (
          <Marker
            coordinate={pin}
            title="New Beacon"
            description="Your job will be placed here"
            pinColor="#6C63FF"
          />
        ) : null}
      </MapView>

      <View style={styles.topControls} pointerEvents="box-none">
        <View style={styles.pill}>
          <View style={styles.pillDot} />
          <Text style={styles.pillTitle}>
            {isLoadingNearby ? 'Searching…' : `${nearby.length} nearby`}
          </Text>
        </View>
      </View>

      <Pressable
        accessibilityRole="button"
        onPress={openCreateSheet}
        style={({ pressed }) => [styles.fab, pressed ? styles.fabPressed : null]}
      >
        <Text style={styles.fabText}>+</Text>
      </Pressable>

      <View style={styles.hint} pointerEvents="none">
        <Text style={styles.hintText}>
          {dropping
            ? 'Move the pin: long-press again. Then add a description below.'
            : 'Long-press anywhere to drop a beacon.'}
        </Text>
      </View>

      {/* ── Job detail Modal ── */}
      <Modal
        visible={selectedBeacon !== null}
        transparent
        animationType="slide"
        onRequestClose={() => setSelectedBeacon(null)}
      >
        <Pressable style={styles.modalOverlay} onPress={() => setSelectedBeacon(null)}>
          <Pressable style={styles.modalCard} onPress={() => undefined}>
            {/* Header */}
            <View style={styles.modalHeader}>
              <View>
                <Text style={styles.modalTitle}>📍 Job Available</Text>
                <Text style={styles.modalPosted}>Tap to accept this task</Text>
              </View>
              <TouchableOpacity onPress={() => setSelectedBeacon(null)} style={styles.modalClose}>
                <Text style={styles.modalCloseText}>✕</Text>
              </TouchableOpacity>
            </View>

            {/* Description */}
            <ScrollView style={styles.modalDescWrap} showsVerticalScrollIndicator={false}>
              <Text style={styles.modalDesc}>{selectedBeacon?.description}</Text>
            </ScrollView>

            {/* Earning card */}
            <View style={styles.modalEarnCard}>
              <Text style={styles.modalEarnLabel}>💰 Earning Potential</Text>
              <Text style={styles.modalEarnValue}>
                {selectedBeacon && (selectedBeacon as any).reward
                  ? `$${(selectedBeacon as any).reward}`
                  : 'Negotiable'}
              </Text>
            </View>

            {/* Actions */}
            <View style={styles.modalActions}>
              <TouchableOpacity
                style={styles.modalBtnSecondary}
                onPress={() => setSelectedBeacon(null)}
              >
                <Text style={styles.modalBtnSecondaryText}>Dismiss</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.modalBtnPrimary} onPress={acceptSelectedBeacon}>
                <Text style={styles.modalBtnPrimaryText}>🚀 Accept Job</Text>
              </TouchableOpacity>
            </View>
          </Pressable>
        </Pressable>
      </Modal>

      {/* ── Create Job Modal ── */}
      <Modal
        visible={isModalVisible}
        animationType="slide"
        transparent
        onRequestClose={closeCreateSheet}
      >
        <Pressable style={styles.modalOverlay} onPress={closeCreateSheet}>
          <Pressable style={styles.createModalCard} onPress={() => undefined}>
            {/* Header */}
            <View style={styles.modalHeader}>
              <View>
                <Text style={styles.modalTitle}>🗺️ Post a Job</Text>
                <Text style={styles.modalPosted}>Fill in the details and drop a pin</Text>
              </View>
              <TouchableOpacity style={styles.modalClose} onPress={closeCreateSheet}>
                <Text style={styles.modalCloseText}>✕</Text>
              </TouchableOpacity>
            </View>

            {/* Location hint */}
            <View style={styles.locationHintBox}>
              <Text style={styles.locationHintText}>
                {pin
                  ? `📍 Pin set: ${pin.latitude.toFixed(4)}, ${pin.longitude.toFixed(4)}`
                  : '📍 Long-press the map to set a pin location'}
              </Text>
            </View>

            {/* Job Description */}
            <Text style={styles.inputLabel}>Job Description *</Text>
            <TextInput
              style={styles.sheetInput}
              value={description}
              onChangeText={setDescription}
              placeholder="What do you need help with? Be specific..."
              placeholderTextColor="#9CA3AF"
              multiline
              numberOfLines={3}
              textAlignVertical="top"
              accessibilityLabel="Job description"
            />

            {/* Earning Potential */}
            <Text style={styles.inputLabel}>💰 Job Cost / Earning Potential</Text>
            <View style={styles.earnRow}>
              <View style={styles.earnRowLeft}>
                <Text style={styles.earnLabel}>Set a fair price</Text>
                <Text style={styles.earnRecommended}>Suggested: $15.00 – $50.00</Text>
              </View>
              <View style={styles.earnInputWrap}>
                <Text style={styles.earnPrefix}>$</Text>
                <TextInput
                  style={styles.earnInput}
                  value={reward}
                  onChangeText={setReward}
                  placeholder="0.00"
                  placeholderTextColor="#9CA3AF"
                  keyboardType="decimal-pad"
                  accessibilityLabel="Job reward amount"
                />
              </View>
            </View>

            {/* Actions */}
            <View style={styles.sheetActions}>
              <TouchableOpacity
                style={[styles.actionBtn, styles.actionSecondary]}
                onPress={closeCreateSheet}
              >
                <Text style={styles.actionSecondaryText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.actionBtn, !canCreate ? styles.actionDisabled : styles.actionPrimary]}
                onPress={onCreate}
                disabled={!canCreate}
              >
                <Text style={styles.actionPrimaryText}>
                  {isCreating ? '⏳ Creating…' : '🚀 Post Job'}
                </Text>
              </TouchableOpacity>
            </View>
          </Pressable>
        </Pressable>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  map: {
    width: Dimensions.get('window').width,
    height: Dimensions.get('window').height,
  },
  topControls: {
    position: 'absolute',
    top: 18,
    left: 16,
    right: 16,
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'flex-start',
  },
  pill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 999,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#EDE9FE',
    shadowColor: '#6C63FF',
    shadowOpacity: 0.15,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
    elevation: 5,
  },
  pillDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#6C63FF',
  },
  pillTitle: {
    fontSize: 12,
    fontWeight: '800',
    color: '#1A1A2E',
    letterSpacing: 0.3,
  },
  pillSubtitle: {
    marginTop: 2,
    fontSize: 12,
    fontWeight: '600',
    color: '#6B7280',
  },
  fab: {
    position: 'absolute',
    bottom: 115,
    right: 20,
    zIndex: 99,
    width: 62,
    height: 62,
    borderRadius: 31,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#6C63FF',
    shadowColor: '#6C63FF',
    shadowOpacity: 0.5,
    shadowRadius: 14,
    shadowOffset: { width: 0, height: 8 },
    elevation: 12,
  },
  fabPressed: {
    transform: [{ scale: 0.93 }],
    opacity: 0.85,
  },
  fabText: {
    color: 'white',
    fontWeight: '900',
    fontSize: 30,
    marginTop: -2,
  },
  markerWrap: {
    alignItems: 'center',
    // Legacy wrap — kept for compatibility
  },
  // ── Simple circle pin markers (guaranteed to render on Android) ──
  markerPin: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 3,
    borderColor: '#FFFFFF',
    shadowColor: '#000',
    shadowOpacity: 0.35,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 3 },
    elevation: 8,
  },
  markerPinOther: {
    backgroundColor: '#6C63FF',
  },
  markerPinMine: {
    backgroundColor: '#8B5CF6',
  },
  markerPinHigh: {
    backgroundColor: '#F59E0B',
  },
  markerPinDraft: {
    backgroundColor: '#94A3B8',
  },
  markerPinEmoji: {
    fontSize: 22,
  },
  marker: {
    minWidth: 80,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 20,
    borderWidth: 2,
    shadowColor: '#000',
    shadowOpacity: 0.25,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 3 },
    elevation: 6,
    alignItems: 'center',
    justifyContent: 'center',
  },
  markerOther: {
    backgroundColor: '#6C63FF',
    borderColor: '#4F46E5',
  },
  markerMine: {
    backgroundColor: '#8B5CF6',
    borderColor: '#7C3AED',
  },
  markerHigh: {
    backgroundColor: '#F59E0B',
    borderColor: '#D97706',
  },
  markerDraft: {
    backgroundColor: 'rgba(255,255,255,0.96)',
    borderColor: 'rgba(229,231,235,0.9)',
  },
  markerText: {
    color: 'white',
    fontSize: 12,
    fontWeight: '800',
  },
  markerTextDraft: {
    color: '#111827',
    fontSize: 12,
    fontWeight: '800',
  },
  markerStem: {
    width: 10,
    height: 10,
    marginTop: -2,
    backgroundColor: '#6C63FF',
    transform: [{ rotate: '45deg' }],
    borderRadius: 2,
  },
  markerStemOther: {
    backgroundColor: '#6C63FF',
  },
  markerStemMine: {
    backgroundColor: '#8B5CF6',
  },
  markerStemHigh: {
    backgroundColor: '#F59E0B',
  },
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
  },
  errorTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#111827',
    textAlign: 'center',
  },
  errorText: {
    marginTop: 8,
    fontSize: 13,
    color: '#6b7280',
    textAlign: 'center',
  },
  hint: {
    position: 'absolute',
    left: 16,
    right: 16,
    bottom: 24,
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderRadius: 16,
    backgroundColor: 'rgba(26,26,46,0.75)',
    borderWidth: 1,
    borderColor: 'rgba(108,99,255,0.3)',
  },
  hintText: {
    color: 'white',
    textAlign: 'center',
    fontWeight: '700',
  },
  sheetIndicator: {
    backgroundColor: '#6C63FF',
    width: 44,
  },
  sheetBackground: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
  },
  sheetContent: {
    flex: 1,
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 18,
    gap: 12,
  },
  sheetHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: 12,
  },
  sheetHeaderLeft: {
    flex: 1,
  },
  sheetTitle: {
    fontSize: 20,
    fontWeight: '900',
    color: '#1A1A2E',
  },
  sheetSubtitle: {
    marginTop: 4,
    fontSize: 12,
    fontWeight: '600',
    color: '#6C63FF',
  },
  sheetClose: {
    paddingHorizontal: 10,
    paddingVertical: 8,
    borderRadius: 999,
    backgroundColor: '#F3F4F6',
  },
  sheetCloseText: {
    color: '#6B7280',
    fontWeight: '800',
    fontSize: 12,
  },
  quickEarnBadge: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 999,
    backgroundColor: '#EDE9FE',
    borderWidth: 1,
    borderColor: '#C4B5FD',
    alignSelf: 'flex-start',
  },
  quickEarnText: {
    fontSize: 10,
    fontWeight: '900',
    color: '#6C63FF',
    letterSpacing: 0.5,
  },
  inputLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: '#6B7280',
    letterSpacing: 0.5,
    textTransform: 'uppercase',
    marginBottom: -4,
  },
  sheetInput: {
    minHeight: 80,
    borderWidth: 1.5,
    borderColor: '#E5E7EB',
    borderRadius: 16,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 14,
    fontWeight: '600',
    color: '#1A1A2E',
    backgroundColor: '#F8F9FA',
  },
  sheetActions: {
    flexDirection: 'row',
    gap: 12,
  },
  actionBtn: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  actionPrimary: {
    backgroundColor: '#6C63FF',
    shadowColor: '#6C63FF',
    shadowOpacity: 0.4,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 6 },
    elevation: 8,
  },
  actionDisabled: {
    backgroundColor: '#F3F4F6',
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  actionSecondary: {
    backgroundColor: '#F3F4F6',
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  actionPrimaryText: {
    color: 'white',
    fontWeight: '900',
    fontSize: 15,
  },
  actionSecondaryText: {
    color: '#6B7280',
    fontWeight: '900',
    fontSize: 14,
  },
  earnRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#EDE9FE',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#C4B5FD',
    padding: 14,
    gap: 12,
  },
  earnRowLeft: {
    flex: 1,
    gap: 4,
  },
  earnLabel: {
    fontSize: 13,
    fontWeight: '800',
    color: '#6C63FF',
  },
  earnRecommended: {
    fontSize: 11,
    fontWeight: '600',
    color: '#7C3AED',
  },
  earnInputWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderWidth: 1.5,
    borderColor: '#C4B5FD',
  },
  earnPrefix: {
    fontSize: 22,
    fontWeight: '900',
    color: '#6C63FF',
  },
  earnInput: {
    fontSize: 22,
    fontWeight: '800',
    color: '#4F46E5',
    minWidth: 70,
    paddingVertical: 0,
  },
  tagRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  tagChip: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 999,
    backgroundColor: '#F3F4F6',
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  tagChipActive: {
    backgroundColor: '#EDE9FE',
    borderColor: '#C4B5FD',
  },
  tagText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#6B7280',
  },
  tagTextActive: {
    color: '#6C63FF',
  },
  // ── Job detail Modal ──
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.6)',
    justifyContent: 'flex-end',
  },
  // ── Create Job Modal card (taller than the beacon detail modal) ──
  createModalCard: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    padding: 24,
    gap: 14,
    borderTopWidth: 1,
    borderColor: '#EDE9FE',
    maxHeight: '90%',
  },
  locationHintBox: {
    backgroundColor: '#F0EDFF',
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderWidth: 1,
    borderColor: '#C4B5FD',
  },
  locationHintText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#6C63FF',
  },
  modalCard: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    padding: 24,
    gap: 16,
    borderTopWidth: 1,
    borderColor: '#EDE9FE',
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '900',
    color: '#1A1A2E',
  },
  modalPosted: {
    marginTop: 4,
    fontSize: 12,
    fontWeight: '600',
    color: '#6C63FF',
  },
  modalClose: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#F3F4F6',
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalCloseText: {
    color: '#6B7280',
    fontWeight: '900',
    fontSize: 14,
  },
  modalDescWrap: {
    maxHeight: 100,
    backgroundColor: '#F8F9FA',
    borderRadius: 14,
    padding: 14,
  },
  modalDesc: {
    fontSize: 15,
    fontWeight: '600',
    color: '#1A1A2E',
    lineHeight: 22,
  },
  modalEarnCard: {
    backgroundColor: '#EDE9FE',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#C4B5FD',
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  modalEarnLabel: {
    fontSize: 14,
    fontWeight: '800',
    color: '#6C63FF',
  },
  modalEarnValue: {
    fontSize: 26,
    fontWeight: '900',
    color: '#4F46E5',
  },
  modalActions: {
    flexDirection: 'row',
    gap: 12,
  },
  modalBtnSecondary: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 16,
    alignItems: 'center',
    backgroundColor: '#F3F4F6',
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  modalBtnSecondaryText: {
    color: '#6B7280',
    fontWeight: '800',
    fontSize: 14,
  },
  modalBtnPrimary: {
    flex: 2,
    paddingVertical: 14,
    borderRadius: 16,
    alignItems: 'center',
    backgroundColor: '#6C63FF',
    shadowColor: '#6C63FF',
    shadowOpacity: 0.4,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 6 },
    elevation: 8,
  },
  modalBtnPrimaryText: {
    color: '#ffffff',
    fontWeight: '900',
    fontSize: 15,
  },
});
