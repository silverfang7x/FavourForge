export type BeaconModel = {
  id: string;
  user_id: string;
  description: string;
  lat: number;
  lon: number;
  accepted: boolean;
  accepted_by: string | null;
  created_at: string;
};
