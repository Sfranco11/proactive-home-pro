
CREATE TABLE public.service_providers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  category text NOT NULL,
  rating numeric(2,1),
  review_count integer NOT NULL DEFAULT 0,
  phone text,
  email text,
  website text,
  service_area text,
  description text,
  photo_urls text[] NOT NULL DEFAULT '{}',
  google_place_id text,
  is_premium_only boolean NOT NULL DEFAULT false,
  sort_rank integer NOT NULL DEFAULT 0,
  active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX service_providers_category_idx ON public.service_providers (category, sort_rank DESC);

GRANT SELECT ON public.service_providers TO authenticated;
GRANT ALL ON public.service_providers TO service_role;

ALTER TABLE public.service_providers ENABLE ROW LEVEL SECURITY;

CREATE POLICY "providers_read_active"
  ON public.service_providers FOR SELECT
  TO authenticated
  USING (active = true);

CREATE TRIGGER service_providers_set_updated_at
  BEFORE UPDATE ON public.service_providers
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
