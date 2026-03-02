import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  Alert,
  Keyboard,
  Platform,
  Pressable,
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

  const mapRef = useRef<MapView | null>(null);
  const sheetRef = useRef<BottomSheet | null>(null);

  const sheetSnapPoints = useMemo(() => ['18%', '46%'], []);

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
    setDropping(true);
    sheetRef.current?.snapToIndex(1);
  }, []);

  const closeCreateSheet = useCallback(() => {
    Keyboard.dismiss();
    sheetRef.current?.close();
    setDropping(false);
    setPin(null);
    setDescription('');
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
    async (beacon: BeaconModel) => {
      if (!region) return;

      if (beacon.user_id === userId) {
        Alert.alert('Your beacon', 'This is your own beacon.');
        return;
      }

      Alert.alert('Accept beacon?', beacon.description, [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Accept',
          onPress: () => {
            acceptBeacon({
              beaconId: beacon.id,
              lat: region.latitude,
              lon: region.longitude,
              maxDistanceM: 150,
            })
              .then(() => {
                setNearby((prev) => prev.filter((b) => b.id !== beacon.id));
                if (onOpenChat) onOpenChat(beacon.id);
              })
              .catch((err: unknown) => {
                const message = err instanceof Error ? err.message : 'Unknown error';
                Alert.alert('Accept failed', message);
              });
          },
        },
      ]);
    },
    [region, userId, onOpenChat],
  );

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
        {nearby.map((b) => (
          <Marker
            key={b.id}
            coordinate={{ latitude: b.lat, longitude: b.lon }}
            onPress={() => onPressBeacon(b)}
          >
            <View style={styles.markerWrap}>
              <View style={[styles.marker, b.user_id === userId ? styles.markerMine : styles.markerOther]}>
                <Text numberOfLines={1} style={styles.markerText}>
                  {b.description}
                </Text>
              </View>
              <View style={styles.markerStem} />
            </View>
          </Marker>
        ))}
        {pin ? (
          <Marker coordinate={pin}>
            <View style={styles.markerWrap}>
              <View style={[styles.marker, styles.markerDraft]}>
                <Text numberOfLines={1} style={styles.markerTextDraft}>
                  New beacon
                </Text>
              </View>
              <View style={styles.markerStem} />
            </View>
          </Marker>
        ) : null}
      </MapView>

      <View style={styles.topControls} pointerEvents="box-none">
        <View style={styles.pill}>
          <Text style={styles.pillTitle}>Beacons</Text>
          <Text style={styles.pillSubtitle}>
            {isLoadingNearby ? 'Searching nearby…' : `${nearby.length} nearby`}
          </Text>
        </View>

        <Pressable
          accessibilityRole="button"
          onPress={openCreateSheet}
          style={({ pressed }) => [styles.fab, pressed ? styles.fabPressed : null]}
        >
          <Text style={styles.fabText}>+</Text>
        </Pressable>
      </View>

      <View style={styles.hint} pointerEvents="none">
        <Text style={styles.hintText}>
          {dropping
            ? 'Move the pin: long-press again. Then add a description below.'
            : 'Long-press anywhere to drop a beacon.'}
        </Text>
      </View>

      <BottomSheet
        ref={(r) => {
          sheetRef.current = r;
        }}
        index={-1}
        enablePanDownToClose
        snapPoints={sheetSnapPoints}
        onClose={() => {
          setDropping(false);
          setPin(null);
          setDescription('');
        }}
        backdropComponent={(props) => (
          <BottomSheetBackdrop {...props} pressBehavior="close" appearsOnIndex={0} disappearsOnIndex={-1} />
        )}
        handleIndicatorStyle={styles.sheetIndicator}
        backgroundStyle={styles.sheetBackground}
      >
        <View style={styles.sheetContent}>
          <View style={styles.sheetHeader}>
            <View style={styles.sheetHeaderLeft}>
              <Text style={styles.sheetTitle}>Create a beacon</Text>
              <Text style={styles.sheetSubtitle}>
                {pin
                  ? `Pinned at ${pin.latitude.toFixed(5)}, ${pin.longitude.toFixed(5)}`
                  : 'Long-press the map to choose a location'}
              </Text>
            </View>

            <TouchableOpacity accessibilityRole="button" onPress={closeCreateSheet} style={styles.sheetClose}>
              <Text style={styles.sheetCloseText}>Close</Text>
            </TouchableOpacity>
          </View>

          <BottomSheetTextInput
            style={styles.sheetInput}
            value={description}
            onChangeText={setDescription}
            placeholder="What do you need help with?"
            placeholderTextColor="#9ca3af"
            multiline
            accessibilityLabel="Beacon description"
            returnKeyType={Platform.select({ ios: 'done', android: 'done' })}
          />

          <View style={styles.sheetActions}>
            <TouchableOpacity
              accessibilityRole="button"
              style={[styles.actionBtn, styles.actionSecondary]}
              onPress={() => {
                setPin(null);
              }}
            >
              <Text style={styles.actionSecondaryText}>Clear pin</Text>
            </TouchableOpacity>

            <TouchableOpacity
              accessibilityRole="button"
              style={[styles.actionBtn, !canCreate ? styles.actionDisabled : styles.actionPrimary]}
              onPress={onCreate}
              disabled={!canCreate}
            >
              <Text style={styles.actionPrimaryText}>{isCreating ? 'Creating…' : 'Create'}</Text>
            </TouchableOpacity>
          </View>
        </View>
      </BottomSheet>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  map: {
    flex: 1,
  },
  topControls: {
    position: 'absolute',
    top: 18,
    left: 16,
    right: 16,
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
  },
  pill: {
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 999,
    backgroundColor: 'rgba(255,255,255,0.92)',
    borderWidth: 1,
    borderColor: 'rgba(229,231,235,0.9)',
    shadowColor: '#000',
    shadowOpacity: 0.12,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 6 },
    elevation: 3,
  },
  pillTitle: {
    fontSize: 12,
    fontWeight: '800',
    color: '#111827',
  },
  pillSubtitle: {
    marginTop: 2,
    fontSize: 12,
    fontWeight: '600',
    color: '#6b7280',
  },
  fab: {
    width: 52,
    height: 52,
    borderRadius: 26,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#111827',
    shadowColor: '#000',
    shadowOpacity: 0.25,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 10 },
    elevation: 6,
  },
  fabPressed: {
    transform: [{ scale: 0.98 }],
    opacity: 0.95,
  },
  fabText: {
    color: 'white',
    fontWeight: '900',
    fontSize: 26,
    marginTop: -1,
  },
  markerWrap: {
    alignItems: 'center',
  },
  marker: {
    maxWidth: 180,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 14,
    borderWidth: 1,
    shadowColor: '#000',
    shadowOpacity: 0.12,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 6 },
    elevation: 3,
  },
  markerOther: {
    backgroundColor: 'rgba(17,24,39,0.92)',
    borderColor: 'rgba(17,24,39,0.2)',
  },
  markerMine: {
    backgroundColor: 'rgba(59,130,246,0.95)',
    borderColor: 'rgba(59,130,246,0.25)',
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
    backgroundColor: 'rgba(17,24,39,0.92)',
    transform: [{ rotate: '45deg' }],
    borderRadius: 2,
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
    backgroundColor: 'rgba(17,24,39,0.72)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
  },
  hintText: {
    color: 'white',
    textAlign: 'center',
    fontWeight: '700',
  },
  sheetIndicator: {
    backgroundColor: '#d1d5db',
    width: 44,
  },
  sheetBackground: {
    backgroundColor: '#ffffff',
    borderTopLeftRadius: 22,
    borderTopRightRadius: 22,
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
    fontSize: 18,
    fontWeight: '900',
    color: '#111827',
  },
  sheetSubtitle: {
    marginTop: 4,
    fontSize: 12,
    fontWeight: '600',
    color: '#6b7280',
  },
  sheetClose: {
    paddingHorizontal: 10,
    paddingVertical: 8,
    borderRadius: 999,
    backgroundColor: '#f3f4f6',
  },
  sheetCloseText: {
    color: '#111827',
    fontWeight: '800',
    fontSize: 12,
  },
  sheetInput: {
    minHeight: 96,
    borderWidth: 1,
    borderColor: '#e5e7eb',
    borderRadius: 16,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 14,
    fontWeight: '600',
    color: '#111827',
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
    backgroundColor: '#111827',
  },
  actionDisabled: {
    backgroundColor: '#9ca3af',
  },
  actionSecondary: {
    backgroundColor: '#f3f4f6',
  },
  actionPrimaryText: {
    color: 'white',
    fontWeight: '900',
  },
  actionSecondaryText: {
    color: '#111827',
    fontWeight: '900',
  },
});
