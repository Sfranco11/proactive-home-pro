import { createServerFn } from '@tanstack/react-start';
import { requireSupabaseAuth } from '@/integrations/supabase/auth-middleware';
import { type StripeEnv, createStripeClient, getStripeErrorMessage } from '@/lib/stripe.server';

type CheckoutSessionResult = { clientSecret: string } | { error: string };
type PortalSessionResult = { url: string } | { error: string };

async function resolveOrCreateCustomer(
  stripe: ReturnType<typeof createStripeClient>,
  options: { email?: string; userId?: string },
): Promise<string> {
  if (options.userId && !/^[a-zA-Z0-9_-]+$/.test(options.userId)) {
    throw new Error('Invalid userId');
  }
  if (options.userId) {
    const found = await stripe.customers.search({
      query: `metadata['userId']:'${options.userId}'`,
      limit: 1,
    });
    if (found.data.length) return found.data[0].id;
  }
  if (options.email) {
    const existing = await stripe.customers.list({ email: options.email, limit: 1 });
    if (existing.data.length) {
      const customer = existing.data[0];
      if (options.userId && customer.metadata?.userId !== options.userId) {
        await stripe.customers.update(customer.id, {
          metadata: { ...customer.metadata, userId: options.userId },
        });
      }
      return customer.id;
    }
  }
  const created = await stripe.customers.create({
    ...(options.email && { email: options.email }),
    ...(options.userId && { metadata: { userId: options.userId } }),
  });
  return created.id;
}

export const createCheckoutSession = createServerFn({ method: 'POST' })
  .inputValidator((data: {
    priceId: string;
    customerEmail?: string;
    userId?: string;
    returnUrl: string;
    environment: StripeEnv;
  }) => {
    if (!/^[a-zA-Z0-9_-]+$/.test(data.priceId)) throw new Error('Invalid priceId');
    return data;
  })
  .handler(async ({ data }): Promise<CheckoutSessionResult> => {
    try {
      const stripe = createStripeClient(data.environment);
      const prices = await stripe.prices.list({ lookup_keys: [data.priceId] });
      if (!prices.data.length) throw new Error('Price not found');
      const stripePrice = prices.data[0];
      const isRecurring = stripePrice.type === 'recurring';

      const customerId = (data.customerEmail || data.userId)
        ? await resolveOrCreateCustomer(stripe, {
            email: data.customerEmail,
            userId: data.userId,
          })
        : undefined;

      const session = await stripe.checkout.sessions.create({
        line_items: [{ price: stripePrice.id, quantity: 1 }],
        mode: isRecurring ? 'subscription' : 'payment',
        ui_mode: 'embedded_page',
        return_url: data.returnUrl,
        ...(customerId && { customer: customerId }),
        managed_payments: { enabled: true },
        ...(isRecurring && {
          subscription_data: {
            trial_period_days: 7,
            ...(data.userId && { metadata: { userId: data.userId } }),
          },
        }),
        ...(data.userId && { metadata: { userId: data.userId, managed_payments: 'true' } }),
      } as any);

      return { clientSecret: session.client_secret ?? '' };
    } catch (error) {
      return { error: getStripeErrorMessage(error) };
    }
  });

export const createPortalSession = createServerFn({ method: 'POST' })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: { returnUrl?: string; environment: StripeEnv }) => data)
  .handler(async ({ data, context }): Promise<PortalSessionResult> => {
    const { supabase, userId } = context;
    const { data: sub, error: subError } = await supabase
      .from('subscriptions')
      .select('stripe_customer_id')
      .eq('user_id', userId)
      .eq('environment', data.environment)
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle();
    if (subError || !sub?.stripe_customer_id) throw new Error('No subscription found');

    try {
      const stripe = createStripeClient(data.environment);
      const portal = await stripe.billingPortal.sessions.create({
        customer: sub.stripe_customer_id as string,
        ...(data.returnUrl && { return_url: data.returnUrl }),
      });
      return { url: portal.url };
    } catch (error) {
      return { error: getStripeErrorMessage(error) };
    }
  });

// ---------- Booking checkout (one-off, dynamic amount) ----------

const FINANCING_THRESHOLD_CENTS = 100_000; // $1,000

type BookingCheckoutResult =
  | { clientSecret: string; amountCents: number; financingAvailable: boolean }
  | { error: string };

export const createBookingCheckoutSession = createServerFn({ method: 'POST' })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: { bookingId: string; returnUrl: string; environment: StripeEnv }) => {
    if (!/^[0-9a-f-]{36}$/i.test(data.bookingId)) throw new Error('Invalid bookingId');
    return data;
  })
  .handler(async ({ data, context }): Promise<BookingCheckoutResult> => {
    try {
      const sb = context.supabase as any;
      const { data: booking, error: bookingErr } = await sb
        .from('bookings')
        .select('id, owner_id, title, category, final_cost, estimated_cost, status, provider:service_providers(name)')
        .eq('id', data.bookingId)
        .eq('owner_id', context.userId)
        .maybeSingle();
      if (bookingErr) throw new Error(bookingErr.message);
      if (!booking) throw new Error('Booking not found');

      const amount = Number(booking.final_cost ?? booking.estimated_cost ?? 0);
      if (!amount || amount <= 0) {
        throw new Error('Your pro hasn\'t set the price yet. They\'ll send an amount before payment.');
      }
      const amountCents = Math.round(amount * 100);
      if (amountCents < 50) throw new Error('Amount must be at least $0.50');

      // Resolve a Stripe customer keyed on Supabase user id (searchable later)
      const { data: claims } = (context as any).claims
        ? { data: (context as any).claims }
        : { data: null };
      const email: string | undefined = claims?.email;

      const stripe = createStripeClient(data.environment);
      const customerId = await resolveOrCreateCustomer(stripe, {
        email,
        userId: context.userId,
      });

      const financingAvailable = amountCents >= FINANCING_THRESHOLD_CENTS;
      const paymentMethodTypes: string[] = ['card'];
      if (financingAvailable) {
        paymentMethodTypes.push('klarna', 'afterpay_clearpay', 'affirm');
      }

      const productName = `${booking.title || booking.category} · ${booking.provider?.name ?? 'Service'}`;

      const session = await stripe.checkout.sessions.create({
        line_items: [{
          price_data: {
            currency: 'usd',
            product_data: { name: productName },
            unit_amount: amountCents,
          },
          quantity: 1,
        }],
        mode: 'payment',
        ui_mode: 'embedded_page',
        return_url: data.returnUrl,
        customer: customerId,
        payment_method_types: paymentMethodTypes as any,
        payment_intent_data: { description: productName },
        metadata: {
          userId: context.userId,
          bookingId: booking.id,
          kind: 'booking',
        },
      });

      return {
        clientSecret: session.client_secret ?? '',
        amountCents,
        financingAvailable,
      };
    } catch (error) {
      return { error: getStripeErrorMessage(error) };
    }
  });

