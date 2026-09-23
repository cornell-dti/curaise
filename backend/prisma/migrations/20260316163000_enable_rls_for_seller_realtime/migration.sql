BEGIN;

-- Supabase provides the `auth` schema and `auth.uid()`, but the throwaway shadow
-- database Prisma builds for `migrate dev` is plain Postgres, so replaying this
-- migration there fails with P3006. Create a stub only when it is missing; on a
-- real Supabase database this block does nothing.
DO $stub$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_namespace WHERE nspname = 'auth') THEN
    CREATE SCHEMA auth;
    CREATE FUNCTION auth.uid() RETURNS uuid LANGUAGE sql STABLE AS 'SELECT NULL::uuid';
  END IF;
END
$stub$;

GRANT USAGE ON SCHEMA public TO authenticated;
GRANT SELECT ON TABLE public.orders, public.referrals TO authenticated;

ALTER TABLE public.orders REPLICA IDENTITY FULL;
ALTER TABLE public.referrals REPLICA IDENTITY FULL;

ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.referrals ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "seller admins can read orders" ON public.orders;
CREATE POLICY "seller admins can read orders"
ON public.orders
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1
    FROM public.fundraisers f
    JOIN public."_OrganizationToUser" otu
      ON otu."A" = f.organization_id
    WHERE f.id = public.orders.fundraiser_id
      AND otu."B" = auth.uid()
  )
);

DROP POLICY IF EXISTS "seller admins can read referrals" ON public.referrals;
CREATE POLICY "seller admins can read referrals"
ON public.referrals
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1
    FROM public.fundraisers f
    JOIN public."_OrganizationToUser" otu
      ON otu."A" = f.organization_id
    WHERE f.id = public.referrals.fundraiser_id
      AND otu."B" = auth.uid()
  )
);

COMMIT;
