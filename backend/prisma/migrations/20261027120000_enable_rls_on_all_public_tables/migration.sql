BEGIN;

-- Supabase's advisor flagged every public table without RLS as readable and
-- writable by anyone holding the anon key through PostgREST. The backend talks
-- to Postgres as the table owner (which bypasses RLS), and the frontend only
-- subscribes to realtime changes on orders and referrals, which already have
-- SELECT policies. So enabling RLS with no policies on the remaining tables
-- locks out anon/authenticated without changing app behaviour.
DO $rls$
DECLARE
  t record;
BEGIN
  FOR t IN
    SELECT tablename
    FROM pg_tables
    WHERE schemaname = 'public' AND NOT rowsecurity
  LOOP
    EXECUTE format('ALTER TABLE public.%I ENABLE ROW LEVEL SECURITY', t.tablename);
  END LOOP;
END
$rls$;

COMMIT;
