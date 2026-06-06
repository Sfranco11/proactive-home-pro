import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { Crown, Check, Loader2 } from "lucide-react";
import { useState } from "react";
import { AppHeader } from "@/components/AppHeader";
import { Button } from "@/components/ui/button";
import { StripeEmbeddedCheckout } from "@/components/StripeEmbeddedCheckout";
import { PaymentTestModeBanner } from "@/components/PaymentTestModeBanner";
import { usePremium } from "@/hooks/usePremium";
import { isPaymentsConfigured } from "@/lib/stripe";
import { createPortalSession } from "@/lib/payments.functions";
import { getStripeEnvironment } from "@/lib/stripe";
import { toast } from "sonner";

export const Route = createFileRoute("/_app/upgrade")({
  component: UpgradePage,
});

const PREMIUM_PERKS = [
  "Full access to every recommended pro",
  "Priority booking & faster response times",
  "Live service tracking, like a ride-share",
  "Exclusive partner discounts & offers",
  "Concierge maintenance recommendations",
  "Auto-scheduled seasonal services",
];

type Plan = "premium_monthly" | "premium_yearly";

function UpgradePage() {
  const navigate = useNavigate();
  const { isPremium, loading, userId, subscription } = usePremium();
  const [selected, setSelected] = useState<Plan | null>(null);
  const [portalLoading, setPortalLoading] = useState(false);

  const openPortal = async () => {
    setPortalLoading(true);
    try {
      const result = await createPortalSession({
        data: { environment: getStripeEnvironment(), returnUrl: window.location.href },
      });
      if ("error" in result) throw new Error(result.error);
      window.open(result.url, "_blank");
    } catch (e: any) {
      toast.error(e.message || "Could not open billing portal");
    } finally {
      setPortalLoading(false);
    }
  };

  if (selected) {
    return (
      <>
        <PaymentTestModeBanner />
        <AppHeader title="Checkout" subtitle="Secure payment" />
        <main className="container-app py-4">
          <Button variant="ghost" size="sm" onClick={() => setSelected(null)} className="mb-3">
            ← Back
          </Button>
          <StripeEmbeddedCheckout
            priceId={selected}
            userId={userId ?? undefined}
            returnUrl={`${window.location.origin}/upgrade?checkout=success&session_id={CHECKOUT_SESSION_ID}`}
          />
        </main>
      </>
    );
  }

  return (
    <>
      <PaymentTestModeBanner />
      <AppHeader title="Go Premium" subtitle="Unlock the full marketplace" />
      <main className="container-app py-6 space-y-6">
        <div className="rounded-2xl border border-border bg-gradient-to-br from-primary/10 via-card to-card p-6 shadow-soft">
          <div className="flex items-center gap-2 text-primary">
            <Crown className="h-5 w-5" />
            <span className="text-xs font-semibold uppercase tracking-wider">Premium</span>
          </div>
          <h2 className="mt-2 font-display text-2xl font-bold">Your home, on autopilot.</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Book any trusted pro, track every service in real time, and never miss a seasonal task again.
          </p>
          <ul className="mt-4 space-y-2">
            {PREMIUM_PERKS.map((p) => (
              <li key={p} className="flex items-start gap-2 text-sm">
                <Check className="mt-0.5 h-4 w-4 shrink-0 text-success" />
                <span>{p}</span>
              </li>
            ))}
          </ul>
        </div>

        {isPremium ? (
          <div className="space-y-3 rounded-2xl border border-primary/40 bg-primary/5 p-5 text-center">
            <Crown className="mx-auto h-6 w-6 text-primary" />
            <p className="font-display text-lg font-semibold">You're Premium.</p>
            {subscription?.current_period_end && (
              <p className="text-xs text-muted-foreground">
                {subscription.cancel_at_period_end ? "Access ends" : "Renews"}{" "}
                {new Date(subscription.current_period_end).toLocaleDateString()}
              </p>
            )}
            <Button onClick={openPortal} disabled={portalLoading} className="w-full">
              {portalLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Manage subscription
            </Button>
            <Button variant="ghost" onClick={() => navigate({ to: "/pros" })} className="w-full">
              Browse pros
            </Button>
          </div>
        ) : (
          <>
            <div className="grid gap-3 sm:grid-cols-2">
              <PlanCard
                plan="Monthly"
                price="$9.99"
                cadence="/ month"
                badge="7-day free trial"
                onClick={() => setSelected("premium_monthly")}
                disabled={!isPaymentsConfigured() || loading || !userId}
              />
              <PlanCard
                plan="Annual"
                price="$79"
                cadence="/ year"
                badge="Save 34%"
                highlight
                onClick={() => setSelected("premium_yearly")}
                disabled={!isPaymentsConfigured() || loading || !userId}
              />
            </div>
            {!userId && !loading && (
              <p className="text-center text-xs text-muted-foreground">
                <Link to="/auth" className="text-primary hover:underline">
                  Sign in
                </Link>{" "}
                to subscribe.
              </p>
            )}
          </>
        )}
      </main>
    </>
  );
}

function PlanCard({
  plan,
  price,
  cadence,
  badge,
  highlight,
  onClick,
  disabled,
}: {
  plan: string;
  price: string;
  cadence: string;
  badge: string;
  highlight?: boolean;
  onClick?: () => void;
  disabled?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className={`text-left rounded-2xl border p-4 shadow-soft transition hover:scale-[1.01] disabled:opacity-60 disabled:cursor-not-allowed ${
        highlight ? "border-primary bg-primary/5" : "border-border bg-card"
      }`}
    >
      <div className="flex items-center justify-between">
        <span className="font-display text-sm font-semibold">{plan}</span>
        <span
          className={`rounded-full px-2 py-0.5 text-[10px] font-semibold ${
            highlight ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"
          }`}
        >
          {badge}
        </span>
      </div>
      <div className="mt-2 flex items-baseline gap-1">
        <span className="font-display text-2xl font-bold">{price}</span>
        <span className="text-xs text-muted-foreground">{cadence}</span>
      </div>
    </button>
  );
}
