import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { Crown, Check, Loader2, Sparkles, ShieldCheck, Archive } from "lucide-react";
import { useState } from "react";
import { AppHeader } from "@/components/AppHeader";
import { Button } from "@/components/ui/button";
import { StripeEmbeddedCheckout } from "@/components/StripeEmbeddedCheckout";
import { PaymentTestModeBanner } from "@/components/PaymentTestModeBanner";
import { usePremium } from "@/hooks/usePremium";
import { isPaymentsConfigured, getStripeEnvironment } from "@/lib/stripe";
import { createPortalSession } from "@/lib/payments.functions";
import { toast } from "sonner";

export const Route = createFileRoute("/_app/upgrade")({
  component: UpgradePage,
});

const CORE_BENEFITS = [
  { i: Sparkles, t: "Vetted pros marketplace", d: "Licensed, insured, ranked by quality" },
  { i: Sparkles, t: "Booking management", d: "Schedule, reschedule, message your pro" },
  { i: Sparkles, t: "Live service tracking", d: "Status, ETA, photos, invoices" },
  { i: Sparkles, t: "Maintenance reminders", d: "Seasonal & on-demand alerts" },
  { i: Sparkles, t: "AutoPilot recurring scheduling", d: "Drafts your next booking on schedule" },
  { i: Sparkles, t: "Digital homeowner records", d: "Everything done, in one place" },
];

const ANNUAL_EXTRAS = [
  { i: Crown, t: "Two months free", d: "Annual pricing saves 34%" },
  { i: Crown, t: "Priority support", d: "Front-of-line concierge" },
  { i: Crown, t: "Preferred vendor discounts", d: "Exclusive partner offers" },
  { i: Crown, t: "Annual maintenance summary", d: "PDF report for your records" },
];

const RETAINED = ["Home records", "Service history", "Receipts & invoices", "Property information"];
const LOST = ["Active AutoPilot schedules", "Premium benefits", "Preferred pricing", "Marketplace booking privileges"];

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
          <Button variant="ghost" size="sm" onClick={() => setSelected(null)} className="mb-3">← Back</Button>
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
      <AppHeader title="Membership" subtitle="The operating system for your home" />
      <main className="container-app py-6 space-y-6 pb-24">
        <div className="rounded-2xl border border-border bg-gradient-to-br from-primary/10 via-card to-card p-6 shadow-soft">
          <div className="flex items-center gap-2 text-primary">
            <Crown className="h-5 w-5" />
            <span className="text-xs font-semibold uppercase tracking-wider">Member</span>
          </div>
          <h2 className="mt-2 font-display text-2xl font-bold">Manage your home in one place.</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Vetted pros, effortless booking, automated recurring maintenance — and a full record of every job.
          </p>
        </div>

        {isPremium ? (
          <div className="space-y-3 rounded-2xl border border-primary/40 bg-primary/5 p-5 text-center">
            <Crown className="mx-auto h-6 w-6 text-primary" />
            <p className="font-display text-lg font-semibold">You're a member.</p>
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
            <Button variant="ghost" onClick={() => navigate({ to: "/autopilot" })} className="w-full">
              Set up AutoPilot
            </Button>
          </div>
        ) : (
          <>
            <div className="grid gap-3 sm:grid-cols-2">
              <PlanCard
                plan="Monthly"
                price="$9.99"
                cadence="/ month"
                tagline="Everything you need to run your home"
                features={CORE_BENEFITS.slice(0, 4).map((b) => b.t)}
                onClick={() => setSelected("premium_monthly")}
                disabled={!isPaymentsConfigured() || loading || !userId}
              />
              <PlanCard
                plan="Annual"
                price="$79"
                cadence="/ year"
                badge="Save 34%"
                tagline="Best value · priority support"
                features={["Everything in Monthly", ...ANNUAL_EXTRAS.map((b) => b.t)]}
                highlight
                onClick={() => setSelected("premium_yearly")}
                disabled={!isPaymentsConfigured() || loading || !userId}
              />
            </div>
            {!userId && !loading && (
              <p className="text-center text-xs text-muted-foreground">
                <Link to="/auth" className="text-primary hover:underline">Sign in</Link> to subscribe.
              </p>
            )}
          </>
        )}

        <section className="rounded-2xl border border-border bg-card p-5 shadow-soft">
          <h3 className="font-display text-base font-semibold">What's included</h3>
          <ul className="mt-3 space-y-2">
            {CORE_BENEFITS.map((b) => (
              <li key={b.t} className="flex items-start gap-3 text-sm">
                <Check className="mt-0.5 h-4 w-4 shrink-0 text-success" />
                <div>
                  <div className="font-medium">{b.t}</div>
                  <div className="text-xs text-muted-foreground">{b.d}</div>
                </div>
              </li>
            ))}
          </ul>
        </section>

        <section className="rounded-2xl border border-primary/30 bg-primary/5 p-5">
          <div className="flex items-center gap-2 text-primary">
            <Crown className="h-4 w-4" />
            <span className="text-xs font-semibold uppercase tracking-wider">Annual extras</span>
          </div>
          <ul className="mt-3 space-y-2">
            {ANNUAL_EXTRAS.map((b) => (
              <li key={b.t} className="flex items-start gap-3 text-sm">
                <Check className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
                <div>
                  <div className="font-medium">{b.t}</div>
                  <div className="text-xs text-muted-foreground">{b.d}</div>
                </div>
              </li>
            ))}
          </ul>
        </section>

        <section className="rounded-2xl border border-border bg-card p-5 shadow-soft">
          <div className="flex items-center gap-2">
            <Archive className="h-4 w-4 text-muted-foreground" />
            <h3 className="font-display text-base font-semibold">If you cancel</h3>
          </div>
          <p className="mt-1 text-xs text-muted-foreground">
            We believe your data is yours. Forever.
          </p>
          <div className="mt-4 grid gap-3 sm:grid-cols-2">
            <div>
              <div className="mb-2 inline-flex items-center gap-1 rounded-full bg-emerald-100 px-2 py-0.5 text-[10px] font-semibold text-emerald-700">
                <ShieldCheck className="h-3 w-3" /> You keep
              </div>
              <ul className="space-y-1 text-sm">
                {RETAINED.map((r) => (
                  <li key={r} className="flex items-center gap-2"><Check className="h-3.5 w-3.5 text-emerald-600" />{r}</li>
                ))}
              </ul>
            </div>
            <div>
              <div className="mb-2 inline-flex items-center gap-1 rounded-full bg-muted px-2 py-0.5 text-[10px] font-semibold text-muted-foreground">
                You pause
              </div>
              <ul className="space-y-1 text-sm text-muted-foreground">
                {LOST.map((r) => <li key={r}>· {r}</li>)}
              </ul>
            </div>
          </div>
        </section>
      </main>
    </>
  );
}

function PlanCard({
  plan, price, cadence, badge, tagline, features, highlight, onClick, disabled,
}: {
  plan: string;
  price: string;
  cadence: string;
  badge?: string;
  tagline: string;
  features: string[];
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
        {badge && (
          <span className={`rounded-full px-2 py-0.5 text-[10px] font-semibold ${highlight ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"}`}>
            {badge}
          </span>
        )}
      </div>
      <div className="mt-2 flex items-baseline gap-1">
        <span className="font-display text-2xl font-bold">{price}</span>
        <span className="text-xs text-muted-foreground">{cadence}</span>
      </div>
      <p className="mt-1 text-xs text-muted-foreground">{tagline}</p>
      <ul className="mt-3 space-y-1">
        {features.map((f) => (
          <li key={f} className="flex items-start gap-1.5 text-[12px]">
            <Check className="mt-0.5 h-3 w-3 shrink-0 text-primary" />
            <span>{f}</span>
          </li>
        ))}
      </ul>
    </button>
  );
}
