# Next Phase Plan: Marketplace, Paywall, Bookings & Automation

This is a large scope. I'll break it into 4 shippable phases so you can review and use each before the next. Each phase ends with something working in your live app.

---

## Phase 1 — Pros Directory (Vaughan, ON)

**Goal:** A browsable, searchable directory of high-rated local pros across all 12 categories, with a "Request booking" CTA wired to the next phase.

- New `service_providers` table (separate from the existing realtor-managed `partners` — these are platform-wide, curated).
  - Fields: name, category, rating, review_count, phone, email, website, service_area, description, photo_urls[], google_place_id, is_premium_only, sort_rank.
- Seed ~5–10 providers per category for Vaughan (sourced via Google Places — see note below).
- New route `/_app/pros` with category filter chips, search, and provider cards.
- Provider detail page `/_app/pros/$id` with photos, full description, reviews count, and **Book Service** CTA.
- Free tier sees only 2 providers per category + locked cards; premium sees all (paywall enforced in Phase 2).

**Data sourcing note:** I'll seed realistic placeholder data for Vaughan now. To pull *live* Google ratings/reviews we need the Google Maps Platform connector (Places API New). I'll wire that as an admin-only refresh job once you confirm.

---

## Phase 2 — Premium Paywall (Stripe)

**Goal:** Free vs Premium tiers with monthly/annual plans and a 7-day free trial.

- Enable Lovable's built-in Stripe payments (no API key needed from you).
- Products: Premium Monthly, Premium Annual, both with 7-day trial.
- New `subscriptions` table mirroring Stripe state (status, plan, current_period_end, trial_end).
- Stripe webhook (`/api/public/webhooks/stripe`) updates subscription state.
- `usePremium()` hook + `<PaywallGate>` component to lock:
  - Full pros directory
  - Priority booking
  - Service tracking
  - Concierge & discounts sections
- Pricing page `/_app/upgrade` with plan cards + checkout redirect.
- Billing portal link for managing/cancelling.

**Note:** Stripe setup is a separate tool call after you approve — it prompts you for business info.

---

## Phase 3 — Bookings, Tracking & Realtor Revenue

**Goal:** End-to-end booking lifecycle with Uber-style tracking and realtor commissions.

### Data model
- `bookings`: id, referral_code (unique), homeowner_id, provider_id, realtor_id, category, service_type (one_time/recurring/seasonal), scheduled_at, status, price, commission_rate, commission_amount, commission_status, notes.
- `booking_events`: timeline entries (status changes, ETA updates, photos).
- `booking_messages`: in-app chat between homeowner & pro.
- Statuses: requested → contacted → scheduled → confirmed → on_the_way → arrived → in_progress → completed (or cancelled).

### Homeowner experience
- "My Bookings" list + detail page with vertical timeline (6 steps).
- Live status updates (Supabase Realtime).
- Before/after photo upload (Lovable Cloud storage bucket).
- Google Maps embed showing pro's ETA when `on_the_way` (Maps connector).
- In-app messaging thread.

### Realtor admin dashboard `/_app/realtor/revenue`
- KPIs: total referrals, completed jobs, revenue generated, pending vs paid commissions, conversion rate.
- Per-provider custom commission rate editor.
- Monthly commission report export (CSV).
- Payout tracking table.

### Pro-side updates
- Lightweight update form (status + ETA + photos) so pros can advance the timeline. (No separate pro app yet — magic-link page per booking.)

---

## Phase 4 — Automation & AI Assistant

**Goal:** "Set it and forget it" recurring/seasonal service management.

- `service_schedules` table: booking_id, cadence (weekly/monthly/quarterly/seasonal), next_due_at, mode (reminder / auto_schedule / auto_book), preferred_provider_id.
- pg_cron job hitting `/api/public/hooks/schedule-tick` daily to:
  - Send reminders for due services
  - Auto-create booking requests for `auto_schedule`
  - Auto-confirm with provider for `auto_book`
- Smart recommendations engine: when a booking completes, infer follow-ups (e.g. lawn care May → recurring summer; furnace Oct → next Oct).
- Home Maintenance Dashboard `/_app/maintenance` showing upcoming, overdue, seasonal, history, est. annual cost.
- AI Home Assistant chat panel using Lovable AI Gateway (google/gemini-2.5-flash):
  - Reads home profile + booking history + seasonal calendar
  - Answers maintenance questions and proposes bookings
  - Free tier: 5 messages/mo; Premium: unlimited.

---

## Technical notes

- **Stack:** existing TanStack Start + Lovable Cloud (Supabase). All new server logic via `createServerFn`; webhooks/cron via `/api/public/*` routes.
- **Connectors needed:** Stripe (built-in, Phase 2), Google Maps Platform (Phase 1 refresh + Phase 3 ETA), Resend (Phase 3/4 emails). I'll prompt you to connect each one at the start of its phase.
- **Push notifications:** web push only initially (no native mobile app exists yet); SMS via Twilio is a later add-on if you want it.
- **Future-proofing:** schema includes hooks for quotes, bidding, white-label, and smart-home integrations without rework.

---

## What I need from you

1. **Approve this phased approach** (or tell me to merge/reorder).
2. **Phase 1 data:** OK to seed realistic placeholder Vaughan providers now and wire live Google data later? Or wait and connect Google Maps first?
3. **Phase 2 pricing:** what should Monthly / Annual cost? (e.g. $9.99/mo, $79/yr)
4. **Phase 2 trial length:** 7 days OK?
5. **Commission default %** for Phase 3 (e.g. 10% of completed job value)?

Once you answer these, I'll start Phase 1.
