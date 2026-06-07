-- Create a homeowner-safe view of partners that excludes sensitive fields
-- (email, discount_code, notes, user_id) and drop the homeowner SELECT
-- policy on the base table so sensitive columns are no longer reachable.

CREATE OR REPLACE VIEW public.partners_homeowner_safe AS
SELECT
  p.id,
  p.realtor_id,
  p.category,
  p.name,
  p.phone,
  p.service_area,
  p.response_time,
  p.hours,
  p.created_at
FROM public.partners p
WHERE EXISTS (
  SELECT 1 FROM public.homes h
  WHERE h.owner_id = auth.uid() AND h.realtor_id = p.realtor_id
);

GRANT SELECT ON public.partners_homeowner_safe TO authenticated;

-- Remove the overly-broad homeowner read policy on the base partners table.
DROP POLICY IF EXISTS partners_homeowner_read ON public.partners;
