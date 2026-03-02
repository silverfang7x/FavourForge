import { supabase } from '@services/SupabaseClient';
import type { BeaconModel } from '@models/BeaconModel';

export async function listNearbyBeacons(params: {
  lat: number;
  lon: number;
  radiusM: number;
  limit?: number;
}): Promise<BeaconModel[]> {
  const { data, error } = await supabase.rpc('nearby_beacons', {
    in_lat: params.lat,
    in_lon: params.lon,
    in_radius_m: Math.trunc(params.radiusM),
    in_limit: Math.trunc(params.limit ?? 200),
  });

  if (error) {
    throw new Error(error.message);
  }

  return (data ?? []) as BeaconModel[];
}

export async function acceptBeacon(params: {
  beaconId: string;
  lat: number;
  lon: number;
  maxDistanceM: number;
}): Promise<BeaconModel> {
  const { data, error } = await supabase.rpc('accept_beacon', {
    in_beacon_id: params.beaconId,
    in_lat: params.lat,
    in_lon: params.lon,
    in_max_distance_m: Math.trunc(params.maxDistanceM),
  });

  if (error) {
    throw new Error(error.message);
  }

  if (!data) {
    throw new Error('No beacon returned');
  }

  return data as BeaconModel;
}
