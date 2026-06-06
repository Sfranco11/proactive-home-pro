
-- Trust signals on service_providers
ALTER TABLE public.service_providers
  ADD COLUMN IF NOT EXISTS licensed boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS insured boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS verified boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS response_time_minutes integer;

-- =========================================================
-- bookings
-- =========================================================
CREATE TABLE IF NOT EXISTS public.bookings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id uuid NOT NULL,
  home_id uuid NOT NULL,
  realtor_id uuid,
  partner_id uuid,
  provider_id uuid,
  category text NOT NULL,
  title text NOT NULL,
  description text,
  status text NOT NULL DEFAULT 'draft',
  severity text NOT NULL DEFAULT 'soon',
  is_recurring boolean NOT NULL DEFAULT false,
  autopilot_schedule_id uuid,
  scheduled_at timestamptz,
  completed_at timestamptz,
  estimated_cost numeric,
  final_cost numeric,
  photo_urls text[] NOT NULL DEFAULT '{}',
  public_token text UNIQUE,
  notes text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.bookings TO authenticated;
GRANT ALL ON public.bookings TO service_role;

ALTER TABLE public.bookings ENABLE ROW LEVEL SECURITY;

CREATE POLICY bookings_owner_all ON public.bookings
  FOR ALL USING (auth.uid() = owner_id) WITH CHECK (auth.uid() = owner_id);

CREATE POLICY bookings_realtor_read ON public.bookings
  FOR SELECT USING (auth.uid() = realtor_id);

CREATE POLICY bookings_partner_read ON public.bookings
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.partners p
      JOIN auth.users u ON u.id = auth.uid()
      WHERE p.id = bookings.partner_id AND p.email = u.email
    )
  );

CREATE TRIGGER trg_bookings_updated_at
  BEFORE UPDATE ON public.bookings
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE INDEX IF NOT EXISTS bookings_owner_idx ON public.bookings(owner_id, created_at DESC);
CREATE INDEX IF NOT EXISTS bookings_realtor_idx ON public.bookings(realtor_id);
CREATE INDEX IF NOT EXISTS bookings_partner_idx ON public.bookings(partner_id);

-- =========================================================
-- booking_events (audit log)
-- =========================================================
CREATE TABLE IF NOT EXISTS public.booking_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  booking_id uuid NOT NULL REFERENCES public.bookings(id) ON DELETE CASCADE,
  actor_id uuid,
  event_type text NOT NULL,
  payload jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT ON public.booking_events TO authenticated;
GRANT ALL ON public.booking_events TO service_role;

ALTER TABLE public.booking_events ENABLE ROW LEVEL SECURITY;

CREATE POLICY booking_events_read ON public.booking_events
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.bookings b
      WHERE b.id = booking_events.booking_id
        AND (b.owner_id = auth.uid() OR b.realtor_id = auth.uid())
    )
  );

CREATE POLICY booking_events_owner_insert ON public.booking_events
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.bookings b
      WHERE b.id = booking_events.booking_id AND b.owner_id = auth.uid()
    )
  );

CREATE INDEX IF NOT EXISTS booking_events_booking_idx ON public.booking_events(booking_id, created_at);

-- =========================================================
-- booking_messages
-- =========================================================
CREATE TABLE IF NOT EXISTS public.booking_messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  booking_id uuid NOT NULL REFERENCES public.bookings(id) ON DELETE CASCADE,
  sender_id uuid NOT NULL,
  sender_role text NOT NULL DEFAULT 'homeowner',
  body text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT ON public.booking_messages TO authenticated;
GRANT ALL ON public.booking_messages TO service_role;

ALTER TABLE public.booking_messages ENABLE ROW LEVEL SECURITY;

CREATE POLICY booking_messages_read ON public.booking_messages
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.bookings b
      WHERE b.id = booking_messages.booking_id
        AND (b.owner_id = auth.uid() OR b.realtor_id = auth.uid())
    )
  );

CREATE POLICY booking_messages_owner_insert ON public.booking_messages
  FOR INSERT WITH CHECK (
    sender_id = auth.uid() AND
    EXISTS (
      SELECT 1 FROM public.bookings b
      WHERE b.id = booking_messages.booking_id AND b.owner_id = auth.uid()
    )
  );

CREATE INDEX IF NOT EXISTS booking_messages_booking_idx ON public.booking_messages(booking_id, created_at);

-- =========================================================
-- realtor_commission_rates
-- =========================================================
CREATE TABLE IF NOT EXISTS public.realtor_commission_rates (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  realtor_id uuid NOT NULL,
  category text NOT NULL,
  rate_percent numeric NOT NULL DEFAULT 0,
  flat_fee numeric,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (realtor_id, category)
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.realtor_commission_rates TO authenticated;
GRANT ALL ON public.realtor_commission_rates TO service_role;

ALTER TABLE public.realtor_commission_rates ENABLE ROW LEVEL SECURITY;

CREATE POLICY commission_realtor_all ON public.realtor_commission_rates
  FOR ALL USING (auth.uid() = realtor_id) WITH CHECK (auth.uid() = realtor_id);

CREATE TRIGGER trg_commission_updated_at
  BEFORE UPDATE ON public.realtor_commission_rates
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- =========================================================
-- autopilot_schedules
-- =========================================================
CREATE TABLE IF NOT EXISTS public.autopilot_schedules (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id uuid NOT NULL,
  home_id uuid NOT NULL,
  category text NOT NULL,
  title text NOT NULL,
  cadence text NOT NULL DEFAULT 'quarterly',
  preferred_partner_id uuid,
  next_run_at timestamptz NOT NULL DEFAULT now(),
  last_run_at timestamptz,
  active boolean NOT NULL DEFAULT true,
  notes text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.autopilot_schedules TO authenticated;
GRANT ALL ON public.autopilot_schedules TO service_role;

ALTER TABLE public.autopilot_schedules ENABLE ROW LEVEL SECURITY;

CREATE POLICY autopilot_owner_all ON public.autopilot_schedules
  FOR ALL USING (auth.uid() = owner_id) WITH CHECK (auth.uid() = owner_id);

CREATE TRIGGER trg_autopilot_updated_at
  BEFORE UPDATE ON public.autopilot_schedules
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE INDEX IF NOT EXISTS autopilot_next_run_idx ON public.autopilot_schedules(active, next_run_at);

-- =========================================================
-- invoices
-- =========================================================
CREATE TABLE IF NOT EXISTS public.invoices (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  booking_id uuid NOT NULL REFERENCES public.bookings(id) ON DELETE CASCADE,
  owner_id uuid NOT NULL,
  realtor_id uuid,
  amount numeric NOT NULL,
  currency text NOT NULL DEFAULT 'USD',
  status text NOT NULL DEFAULT 'pending',
  pdf_url text,
  paid_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.invoices TO authenticated;
GRANT ALL ON public.invoices TO service_role;

ALTER TABLE public.invoices ENABLE ROW LEVEL SECURITY;

CREATE POLICY invoices_owner_read ON public.invoices
  FOR SELECT USING (auth.uid() = owner_id);

CREATE POLICY invoices_realtor_read ON public.invoices
  FOR SELECT USING (auth.uid() = realtor_id);

CREATE TRIGGER trg_invoices_updated_at
  BEFORE UPDATE ON public.invoices
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE INDEX IF NOT EXISTS invoices_owner_idx ON public.invoices(owner_id, created_at DESC);

-- =========================================================
-- Realtime
-- =========================================================
ALTER TABLE public.bookings REPLICA IDENTITY FULL;
ALTER TABLE public.booking_events REPLICA IDENTITY FULL;
ALTER TABLE public.booking_messages REPLICA IDENTITY FULL;

DO $$
BEGIN
  BEGIN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.bookings;
  EXCEPTION WHEN duplicate_object THEN NULL; END;
  BEGIN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.booking_events;
  EXCEPTION WHEN duplicate_object THEN NULL; END;
  BEGIN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.booking_messages;
  EXCEPTION WHEN duplicate_object THEN NULL; END;
END $$;
