# Supabase schema setup

## Apply schema

1. Open Supabase dashboard
2. Go to SQL Editor
3. Paste and run `schema.sql`

## Notes

- Tables are created in `public`.
- PostGIS is enabled and `beacons.location` is a generated `GEOGRAPHY(POINT, 4326)` column with a GiST index.
- RLS is enabled for `beacons` and `chat_messages` with basic policies suitable for early development.
