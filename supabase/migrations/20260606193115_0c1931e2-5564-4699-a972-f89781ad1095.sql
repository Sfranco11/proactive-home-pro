
-- 1) Stop trusting client-supplied role at signup; always create homeowner profiles.
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
    'homeowner'
  )
  on conflict (user_id) do nothing;
  return new;
end;
$$;
revoke execute on function public.handle_new_user() from public, anon, authenticated;

-- 2) Prevent users from changing their own role via profile updates.
drop policy if exists "profiles_update_own" on public.profiles;
create policy "profiles_update_own" on public.profiles
  for update using (auth.uid() = user_id)
  with check (auth.uid() = user_id and role = (select p.role from public.profiles p where p.user_id = auth.uid()));

-- 3) Realtors: require profile.role='realtor' to insert into realtors.
drop policy if exists "realtors_insert_own" on public.realtors;
create policy "realtors_insert_own" on public.realtors
  for insert
  with check (
    auth.uid() = user_id
    and exists (select 1 from public.profiles p where p.user_id = auth.uid() and p.role = 'realtor')
  );

-- 4) Realtors public read: remove broad anon-readable policy; restrict to authenticated users.
drop policy if exists "realtors_public_read" on public.realtors;
create policy "realtors_authenticated_read" on public.realtors
  for select to authenticated using (true);

-- Provide a safe SECURITY DEFINER function for unauthenticated invite landing.
create or replace function public.get_realtor_brand(_code text)
returns table (company_name text, brand_color text, logo_url text)
language sql
stable
security definer
set search_path = public
as $$
  select company_name, brand_color, logo_url
  from public.realtors
  where referral_code = upper(_code)
  limit 1;
$$;
revoke execute on function public.get_realtor_brand(text) from public;
grant execute on function public.get_realtor_brand(text) to anon, authenticated;

-- 5) Referrals: ensure homeowner inserts only reference their actual realtor + a partner of that realtor.
drop policy if exists "referrals_homeowner_insert" on public.referrals;
create policy "referrals_homeowner_insert" on public.referrals
  for insert
  with check (
    auth.uid() = homeowner_id
    and exists (
      select 1 from public.homes h
      where h.owner_id = auth.uid() and h.realtor_id = referrals.realtor_id
    )
    and exists (
      select 1 from public.partners p
      where p.id = referrals.partner_id and p.realtor_id = referrals.realtor_id
    )
  );
