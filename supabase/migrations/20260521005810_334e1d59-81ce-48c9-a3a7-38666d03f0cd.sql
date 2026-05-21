
-- Helper enum-like via text checks (using triggers later if needed)

-- PROFILES
create table public.profiles (
  user_id uuid primary key references auth.users(id) on delete cascade,
  full_name text,
  phone text,
  role text not null default 'homeowner' check (role in ('homeowner','realtor')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
alter table public.profiles enable row level security;

create policy "profiles_select_own" on public.profiles for select using (auth.uid() = user_id);
create policy "profiles_insert_own" on public.profiles for insert with check (auth.uid() = user_id);
create policy "profiles_update_own" on public.profiles for update using (auth.uid() = user_id);

-- REALTORS
create table public.realtors (
  user_id uuid primary key references auth.users(id) on delete cascade,
  company_name text not null default 'My Realty',
  brand_color text not null default '#064e3b',
  logo_url text,
  referral_code text not null unique,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
alter table public.realtors enable row level security;

-- Public can read brand info by referral_code (for invite landing). Limit columns via grants? simple: allow select.
create policy "realtors_public_read" on public.realtors for select using (true);
create policy "realtors_insert_own" on public.realtors for insert with check (auth.uid() = user_id);
create policy "realtors_update_own" on public.realtors for update using (auth.uid() = user_id);

-- HOMES
create table public.homes (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references auth.users(id) on delete cascade,
  realtor_id uuid references public.realtors(user_id) on delete set null,
  home_type text not null default 'single_family',
  year_built int,
  climate_zone text,
  address text,
  hvac_type text,
  foundation_type text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
alter table public.homes enable row level security;
create index on public.homes (owner_id);
create index on public.homes (realtor_id);

create policy "homes_owner_all" on public.homes for all using (auth.uid() = owner_id) with check (auth.uid() = owner_id);
create policy "homes_realtor_read" on public.homes for select using (auth.uid() = realtor_id);

-- PARTNERS
create table public.partners (
  id uuid primary key default gen_random_uuid(),
  realtor_id uuid not null references public.realtors(user_id) on delete cascade,
  name text not null,
  category text not null,
  phone text,
  email text,
  service_area text,
  response_time text,
  hours text,
  discount_code text,
  notes text,
  created_at timestamptz not null default now()
);
alter table public.partners enable row level security;
create index on public.partners (realtor_id);
create index on public.partners (category);

create policy "partners_realtor_all" on public.partners for all using (auth.uid() = realtor_id) with check (auth.uid() = realtor_id);
-- Homeowners can read partners of their linked realtor
create policy "partners_homeowner_read" on public.partners for select using (
  exists (select 1 from public.homes h where h.owner_id = auth.uid() and h.realtor_id = partners.realtor_id)
);

-- MAINTENANCE LOGS
create table public.maintenance_logs (
  id uuid primary key default gen_random_uuid(),
  home_id uuid not null references public.homes(id) on delete cascade,
  owner_id uuid not null references auth.users(id) on delete cascade,
  season text,
  task_key text,
  title text not null,
  notes text,
  photo_url text,
  performed_by text not null default 'diy' check (performed_by in ('diy','pro')),
  cost numeric,
  partner_id uuid references public.partners(id) on delete set null,
  completed_at timestamptz not null default now(),
  created_at timestamptz not null default now()
);
alter table public.maintenance_logs enable row level security;
create index on public.maintenance_logs (home_id);
create index on public.maintenance_logs (owner_id);

create policy "logs_owner_all" on public.maintenance_logs for all using (auth.uid() = owner_id) with check (auth.uid() = owner_id);
create policy "logs_realtor_read" on public.maintenance_logs for select using (
  exists (select 1 from public.homes h where h.id = maintenance_logs.home_id and h.realtor_id = auth.uid())
);

-- TRIAGE REQUESTS
create table public.triage_requests (
  id uuid primary key default gen_random_uuid(),
  home_id uuid not null references public.homes(id) on delete cascade,
  owner_id uuid not null references auth.users(id) on delete cascade,
  category text not null,
  description text,
  photo_url text,
  severity text not null default 'soon' check (severity in ('urgent','soon','non_critical')),
  partner_id uuid references public.partners(id) on delete set null,
  created_at timestamptz not null default now()
);
alter table public.triage_requests enable row level security;
create index on public.triage_requests (owner_id);

create policy "triage_owner_all" on public.triage_requests for all using (auth.uid() = owner_id) with check (auth.uid() = owner_id);
create policy "triage_realtor_read" on public.triage_requests for select using (
  exists (select 1 from public.homes h where h.id = triage_requests.home_id and h.realtor_id = auth.uid())
);

-- REFERRALS
create table public.referrals (
  id uuid primary key default gen_random_uuid(),
  homeowner_id uuid not null references auth.users(id) on delete cascade,
  realtor_id uuid not null references public.realtors(user_id) on delete cascade,
  partner_id uuid not null references public.partners(id) on delete cascade,
  category text not null,
  triage_id uuid references public.triage_requests(id) on delete set null,
  fee_status text not null default 'pending' check (fee_status in ('pending','paid','waived')),
  fee_amount numeric,
  notes text,
  created_at timestamptz not null default now()
);
alter table public.referrals enable row level security;
create index on public.referrals (realtor_id);
create index on public.referrals (partner_id);

create policy "referrals_realtor_all" on public.referrals for all using (auth.uid() = realtor_id) with check (auth.uid() = realtor_id);
create policy "referrals_homeowner_insert" on public.referrals for insert with check (auth.uid() = homeowner_id);
create policy "referrals_homeowner_read" on public.referrals for select using (auth.uid() = homeowner_id);

-- AUTO-CREATE PROFILE ON SIGNUP
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  insert into public.profiles (user_id, full_name, role)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'full_name', ''),
    coalesce(new.raw_user_meta_data->>'role', 'homeowner')
  )
  on conflict (user_id) do nothing;
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- updated_at triggers
create or replace function public.set_updated_at()
returns trigger language plpgsql as $$
begin new.updated_at = now(); return new; end; $$;

create trigger profiles_updated before update on public.profiles for each row execute function public.set_updated_at();
create trigger realtors_updated before update on public.realtors for each row execute function public.set_updated_at();
create trigger homes_updated before update on public.homes for each row execute function public.set_updated_at();
