# Payments & Realtor Payouts

Two systems, built in this order so homeowners can pay now and realtors can cash out as soon as their Connect onboarding completes.

---

## Phase 1 — Homeowner in-app checkout (built first)

Goal: every booking gets a **Pay** button. Cards + Apple Pay + Google Pay always available; **Klarna / Affirm / Afterpay shown when `final_cost ≥ $1,000`**.

### Backend
- New server fn `createBookingCheckoutSession({ bookingId, environment })` in `src/lib/payments.functions.ts`
  - Uses the existing `createStripeClient` shared utility
  - Loads booking, asserts `auth.uid() = owner_id`, requires `final_cost` set by the pro
  - Builds an embedded checkout session with `price_data` (dynamic amount = `final_cost`)
  - `payment_method_types`: cards always; if `final_cost ≥ 1000` add `klarna`, `affirm`, `afterpay_clearpay`
  - Apple Pay / Google Pay come free with cards on embedded checkout
  - Stamps `metadata.bookingId` + `metadata.userId`
  - Returns `clientSecret`
- Extend the existing `/api/public/payments/webhook` handler to also handle `checkout.session.completed` for bookings → write `invoices` row (`status='paid'`, `amount`, `paid_at`) and flip the booking to `status='completed'`.

### Frontend
- `<PayBookingButton booking={…} />` opens `StripeEmbeddedCheckout` in a dialog
- Shown in `_app.bookings.$id.tsx` once the pro has set a `final_cost` and `status !== 'completed'`
- After return, the booking detail page reads invoice + payment status from `invoices`
- A "💳 Pay over time available" hint renders when `final_cost ≥ 1000`

### Data
- Backfill: `invoices` table already exists. No schema changes needed.

---

## Phase 2 — Realtor Connect onboarding + payout split

Goal: each realtor links a Stripe Express account once; every paid booking automatically routes their commission to their bank.

### Prerequisite (requires user action)
- **Switch from built-in payments to BYOK Stripe** so we can use Connect (`enable_stripe` BYOK). User provides a Stripe secret key from their own Stripe account; that account becomes the platform.
- The webhook URL stays the same; we just swap the key source.

### Database
- New table `realtor_payout_accounts`: `realtor_id (uuid, unique)`, `stripe_account_id (text)`, `charges_enabled (bool)`, `payouts_enabled (bool)`, `details_submitted (bool)`, `requirements (jsonb)`, timestamps. RLS: realtor reads own row; service_role writes.

### Backend
- `createConnectOnboardingLink()` — creates an Express Connect account if missing, returns an account-link URL to embed/launch
- `getPayoutAccountStatus()` — returns the row + a fresh Stripe `accounts.retrieve` so the UI reflects KYC progress live
- Extend `createBookingCheckoutSession`:
  - Look up realtor's connected account
  - Look up the per-category commission rate from `realtor_commission_rates`
  - Add `payment_intent_data: { application_fee_amount, transfer_data: { destination: realtor_stripe_account_id } }`
  - If realtor isn't onboarded yet, fall back to a normal charge with no transfer; commission accrues as a "pending payout" we settle manually later
- Extend the webhook to handle `account.updated` → upsert the payout-account flags
- Extend the webhook's `checkout.session.completed` → write a `payouts` log row (amount, fee, status) for the realtor dashboard

### Frontend
- New `_app.realtor.payouts.tsx` route:
  - "Connect your bank" CTA → onboarding link (opens new tab)
  - Status card: charges enabled / payouts enabled / outstanding KYC requirements
  - Payouts feed (date, booking, commission $, status)
- `realtor.revenue` page gets a "Paid out" column wired to the real Stripe payout data

---

## What I need from you before Phase 2

1. **Confirm you're OK switching to BYOK Stripe** so we can use Connect (Phase 1 works fine with either; only Phase 2 requires it).
2. **Your Stripe secret key** (sandbox first). You'll create the Stripe account at stripe.com → grab the secret key → I'll add it via the secrets tool.
3. Your country and the realtors' likely countries (Connect availability is per-country; US/CA/EU/UK/AU all good).

---

## What this plan does NOT include (yet)

- Refunds UI (Stripe portal handles it; we can add a button later)
- Disputes/chargeback handling (Stripe dashboard for now)
- Pro payouts — pros still get paid by realtors out-of-band per your earlier model; only realtor commissions flow through Connect
- Tax handling on Connect transactions (Stripe Tax + Connect adds complexity; happy to layer on once basic payouts work)

---

## Suggested next step

Reply with **"Build Phase 1"** to start with in-app checkout (works immediately, no new credentials), or **"Build everything"** if you're ready to set up the Stripe account today and I'll wire Phase 2 alongside.
