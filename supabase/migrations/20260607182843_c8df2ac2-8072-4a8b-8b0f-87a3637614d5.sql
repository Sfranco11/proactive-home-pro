-- ============ realtor_bounties ============
CREATE TABLE public.realtor_bounties (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  realtor_id uuid NOT NULL,
  homeowner_id uuid NOT NULL,
  tier text NOT NULL CHECK (tier IN ('premium', 'complete')),
  amount_cents integer NOT NULL,
  currency text NOT NULL DEFAULT 'USD',
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'paid', 'void')),
  stripe_subscription_id text,
  environment text NOT NULL DEFAULT 'sandbox',
  notes text,
  created_at timestamptz NOT NULL DEFAULT now(),
  paid_at timestamptz,
  UNIQUE (stripe_subscription_id, environment)
);

GRANT SELECT ON public.realtor_bounties TO authenticated;
GRANT ALL ON public.realtor_bounties TO service_role;

ALTER TABLE public.realtor_bounties ENABLE ROW LEVEL SECURITY;

CREATE POLICY bounties_realtor_read ON public.realtor_bounties
  FOR SELECT USING (auth.uid() = realtor_id);

CREATE INDEX realtor_bounties_realtor_idx ON public.realtor_bounties(realtor_id, status);

-- ============ loyalty_credits ============
CREATE TABLE public.loyalty_credits (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id uuid NOT NULL,
  amount_cents integer NOT NULL,
  currency text NOT NULL DEFAULT 'USD',
  member_year integer NOT NULL,
  status text NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'redeemed', 'expired')),
  granted_at timestamptz NOT NULL DEFAULT now(),
  expires_at timestamptz,
  redeemed_booking_id uuid,
  redeemed_at timestamptz,
  stripe_subscription_id text,
  environment text NOT NULL DEFAULT 'sandbox',
  UNIQUE (stripe_subscription_id, member_year, environment)
);

GRANT SELECT ON public.loyalty_credits TO authenticated;
GRANT ALL ON public.loyalty_credits TO service_role;

ALTER TABLE public.loyalty_credits ENABLE ROW LEVEL SECURITY;

CREATE POLICY loyalty_owner_read ON public.loyalty_credits
  FOR SELECT USING (auth.uid() = owner_id);

CREATE INDEX loyalty_credits_owner_idx ON public.loyalty_credits(owner_id, status);

-- ============ Helper: get_member_tier ============
CREATE OR REPLACE FUNCTION public.get_member_tier(_price_id text)
RETURNS text
LANGUAGE sql
IMMUTABLE
SECURITY INVOKER
SET search_path = public
AS $$
  SELECT CASE
    WHEN _price_id IN ('complete_annual', 'complete_yearly') THEN 'complete'
    WHEN _price_id IN ('premium_annual', 'premium_yearly', 'premium_monthly') THEN 'premium'
    ELSE 'none'
  END;
$$;