BEGIN;

CREATE OR REPLACE FUNCTION public.is_org_admin_for_fundraiser(
  target_fundraiser_id uuid
)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.fundraisers f
    JOIN public."_OrganizationToUser" otu
      ON otu."A" = f.organization_id
    WHERE f.id = target_fundraiser_id
      AND otu."B" = auth.uid()
  );
$$;

REVOKE ALL ON FUNCTION public.is_org_admin_for_fundraiser(uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.is_org_admin_for_fundraiser(uuid) TO authenticated;

DROP POLICY IF EXISTS "seller admins can read orders" ON public.orders;
CREATE POLICY "seller admins can read orders"
ON public.orders
FOR SELECT
TO authenticated
USING (public.is_org_admin_for_fundraiser(fundraiser_id));

DROP POLICY IF EXISTS "seller admins can read referrals" ON public.referrals;
CREATE POLICY "seller admins can read referrals"
ON public.referrals
FOR SELECT
TO authenticated
USING (public.is_org_admin_for_fundraiser(fundraiser_id));

COMMIT;
