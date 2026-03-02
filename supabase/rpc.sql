-- Nearby beacons via PostGIS (meters)
CREATE OR REPLACE FUNCTION public.nearby_beacons(
  in_lat double precision,
  in_lon double precision,
  in_radius_m integer DEFAULT 1500,
  in_limit integer DEFAULT 200
)
RETURNS SETOF public.beacons
LANGUAGE sql
STABLE
AS $$
  SELECT *
  FROM public.beacons b
  WHERE ST_DWithin(
    b.location,
    ST_SetSRID(ST_MakePoint(in_lon, in_lat), 4326)::geography,
    in_radius_m
  )
  ORDER BY b.created_at DESC
  LIMIT in_limit;
$$;

-- Accept beacon with proximity validation
CREATE OR REPLACE FUNCTION public.accept_beacon(
  in_beacon_id uuid,
  in_lat double precision,
  in_lon double precision,
  in_max_distance_m integer DEFAULT 150
)
RETURNS public.beacons
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_beacon public.beacons;
  v_distance double precision;
BEGIN
  SELECT * INTO v_beacon
  FROM public.beacons
  WHERE id = in_beacon_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Beacon not found';
  END IF;

  IF v_beacon.accepted THEN
    RAISE EXCEPTION 'Beacon already accepted';
  END IF;

  v_distance := ST_Distance(
    v_beacon.location,
    ST_SetSRID(ST_MakePoint(in_lon, in_lat), 4326)::geography
  );

  IF v_distance > in_max_distance_m THEN
    RAISE EXCEPTION 'Too far from beacon (%.2f m > % m)', v_distance, in_max_distance_m;
  END IF;

  UPDATE public.beacons
  SET accepted = true,
      accepted_by = auth.uid()
  WHERE id = in_beacon_id
  RETURNING * INTO v_beacon;

  RETURN v_beacon;
END;
$$;

REVOKE ALL ON FUNCTION public.accept_beacon(uuid, double precision, double precision, integer) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.accept_beacon(uuid, double precision, double precision, integer) TO authenticated;
