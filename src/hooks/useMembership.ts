import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { getStripeEnvironment, isPaymentsConfigured } from "@/lib/stripe";
import { type MemberTier, tierFromPriceId } from "@/lib/membership";

export interface MembershipInfo {
  tier: MemberTier;
  status: string | null;
  priceId: string | null;
  currentPeriodEnd: string | null;
  cancelAtPeriodEnd: boolean | null;
  createdAt: string | null;
  loading: boolean;
  userId: string | null;
  isActive: boolean;
}

const EMPTY: MembershipInfo = {
  tier: "none",
  status: null,
  priceId: null,
  currentPeriodEnd: null,
  cancelAtPeriodEnd: null,
  createdAt: null,
  loading: true,
  userId: null,
  isActive: false,
};

export function useMembership(): MembershipInfo {
  const [state, setState] = useState<MembershipInfo>(EMPTY);

  useEffect(() => {
    let cancelled = false;

    async function load(uid: string | null) {
      if (!uid || !isPaymentsConfigured()) {
        if (!cancelled) setState({ ...EMPTY, userId: uid, loading: false });
        return;
      }
      const env = getStripeEnvironment();
      const { data } = await supabase
        .from("subscriptions")
        .select("status, price_id, current_period_end, cancel_at_period_end, created_at")
        .eq("user_id", uid)
        .eq("environment", env)
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle();

      if (cancelled) return;

      const priceId = (data?.price_id as string | undefined) ?? null;
      const tier = tierFromPriceId(priceId);
      const status = (data?.status as string | undefined) ?? null;
      const periodEnd = (data?.current_period_end as string | null | undefined) ?? null;
      const periodEndMs = periodEnd ? new Date(periodEnd).getTime() : null;
      const now = Date.now();
      const isActive =
        !!status &&
        (
          (["active", "trialing", "past_due"].includes(status) &&
            (periodEndMs === null || periodEndMs > now)) ||
          (status === "canceled" && periodEndMs !== null && periodEndMs > now)
        );

      setState({
        tier: isActive ? tier : "none",
        status,
        priceId,
        currentPeriodEnd: periodEnd,
        cancelAtPeriodEnd: (data?.cancel_at_period_end as boolean | null | undefined) ?? null,
        createdAt: (data?.created_at as string | null | undefined) ?? null,
        loading: false,
        userId: uid,
        isActive,
      });
    }

    supabase.auth.getSession().then(({ data }) => {
      const uid = data.session?.user.id ?? null;
      load(uid);
    });

    const { data: sub } = supabase.auth.onAuthStateChange((_event, session) => {
      load(session?.user.id ?? null);
    });

    return () => {
      cancelled = true;
      sub.subscription.unsubscribe();
    };
  }, []);

  return state;
}
