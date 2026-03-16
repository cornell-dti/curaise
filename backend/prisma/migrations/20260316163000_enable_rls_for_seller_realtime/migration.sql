BEGIN;

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
