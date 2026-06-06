import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { getStripeEnvironment, isPaymentsConfigured } from '@/lib/stripe';

export interface SubscriptionInfo {
  status: string;
  price_id: string;
  current_period_end: string | null;
  cancel_at_period_end: boolean | null;
}

export function usePremium() {
  const [loading, setLoading] = useState(true);
  const [subscription, setSubscription] = useState<SubscriptionInfo | null>(null);
  const [userId, setUserId] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function load(uid: string | null) {
      if (!uid || !isPaymentsConfigured()) {
        if (!cancelled) {
          setSubscription(null);
          setLoading(false);
        }
        return;
      }
      const env = getStripeEnvironment();
      const { data } = await supabase
        .from('subscriptions')
        .select('status, price_id, current_period_end, cancel_at_period_end')
        .eq('user_id', uid)
        .eq('environment', env)
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();
      if (!cancelled) {
        setSubscription(data as SubscriptionInfo | null);
        setLoading(false);
      }
    }

    supabase.auth.getSession().then(({ data }) => {
      const uid = data.session?.user.id ?? null;
      setUserId(uid);
      load(uid);
    });

    const { data: sub } = supabase.auth.onAuthStateChange((_event, session) => {
      const uid = session?.user.id ?? null;
      setUserId(uid);
      load(uid);
    });

    return () => {
      cancelled = true;
      sub.subscription.unsubscribe();
    };
  }, []);

  const now = Date.now();
  const periodEndMs = subscription?.current_period_end
    ? new Date(subscription.current_period_end).getTime()
    : null;

  const isActive = !!subscription && (
    (['active', 'trialing', 'past_due'].includes(subscription.status) &&
      (periodEndMs === null || periodEndMs > now)) ||
    (subscription.status === 'canceled' && periodEndMs !== null && periodEndMs > now)
  );

  return {
    loading,
    isPremium: isActive,
    subscription,
    userId,
  };
}
