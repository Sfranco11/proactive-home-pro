
-- 1) Restrict realtors table reads to the realtor's own row; expose brand info via a safe function
DROP POLICY IF EXISTS realtors_authenticated_read ON public.realtors;

CREATE POLICY realtors_select_own ON public.realtors
  FOR SELECT TO authenticated
  USING (auth.uid() = user_id);

CREATE OR REPLACE FUNCTION public.get_realtor_brand_by_id(_user_id uuid)
RETURNS TABLE(company_name text, brand_color text, logo_url text)
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
AS $$
  SELECT company_name, brand_color, logo_url
  FROM public.realtors
  WHERE user_id = _user_id
    AND EXISTS (
      SELECT 1 FROM public.homes h
      WHERE h.owner_id = auth.uid() AND h.realtor_id = _user_id
    )
  LIMIT 1;
$$;

REVOKE EXECUTE ON FUNCTION public.get_realtor_brand_by_id(uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.get_realtor_brand_by_id(uuid) TO authenticated;

-- Resolve a realtor's user_id from a referral code without exposing the realtors table
CREATE OR REPLACE FUNCTION public.resolve_realtor_by_code(_code text)
RETURNS uuid
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
AS $$
  SELECT user_id FROM public.realtors
  WHERE referral_code = upper(_code)
  LIMIT 1;
$$;

REVOKE EXECUTE ON FUNCTION public.resolve_realtor_by_code(text) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.resolve_realtor_by_code(text) TO authenticated;

-- 2) Tie partner booking access to a verified user identity, not email matching
ALTER TABLE public.partners
  ADD COLUMN IF NOT EXISTS user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS partners_user_id_idx ON public.partners(user_id);

DROP POLICY IF EXISTS bookings_partner_read ON public.bookings;

CREATE POLICY bookings_partner_read ON public.bookings
  FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM public.partners p
    WHERE p.id = bookings.partner_id
      AND p.user_id IS NOT NULL
      AND p.user_id = auth.uid()
  ));
