CREATE TABLE public.home_equipment (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id uuid NOT NULL,
  home_id uuid NOT NULL,
  type text NOT NULL,
  category text NOT NULL DEFAULT 'system',
  name text NOT NULL,
  brand text,
  model text,
  install_date date,
  expected_lifespan_months integer,
  service_interval_months integer,
  last_serviced_at date,
  notes text,
  photo_url text,
  partner_category text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.home_equipment TO authenticated;
GRANT ALL ON public.home_equipment TO service_role;

ALTER TABLE public.home_equipment ENABLE ROW LEVEL SECURITY;

CREATE POLICY equipment_owner_all ON public.home_equipment
  FOR ALL USING (auth.uid() = owner_id) WITH CHECK (auth.uid() = owner_id);

CREATE POLICY equipment_realtor_read ON public.home_equipment
  FOR SELECT USING (EXISTS (
    SELECT 1 FROM public.homes h
    WHERE h.id = home_equipment.home_id AND h.realtor_id = auth.uid()
  ));

CREATE TRIGGER home_equipment_set_updated_at
  BEFORE UPDATE ON public.home_equipment
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE INDEX home_equipment_owner_idx ON public.home_equipment(owner_id);
CREATE INDEX home_equipment_home_idx ON public.home_equipment(home_id);