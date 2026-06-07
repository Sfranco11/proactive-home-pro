import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { Crown, Check, Loader2, ShieldCheck, Archive, Snowflake, Sun, Sparkles } from "lucide-react";
import { useState } from "react";
import { AppHeader } from "@/components/AppHeader";
import { Button } from "@/components/ui/button";
import { StripeEmbeddedCheckout } from "@/components/StripeEmbeddedCheckout";
import { PaymentTestModeBanner } from "@/components/PaymentTestModeBanner";
import { useMembership } from "@/hooks/useMembership";
import { isPaymentsConfigured, getStripeEnvironment } from "@/lib/stripe";
import { createPortalSession } from "@/lib/payments.functions";
import { TIER_LABELS } from "@/lib/membership";
import { toast } from "sonner";

export const Route = createFileRoute("/_app/upgrade")({
  component: UpgradePage,
});

type Plan = "premium_annual" | "complete_annual";

const PLATFORM_BENEFITS = [
  "Vetted, licensed & insured pros",
  "Member pricing on every booking",
  "Emergency triage & priority response",
  "Digital home profile & service history",
  "AutoPilot recurring scheduling",
  "Equipment tracking with health alerts",
];

const COMPLETE_EXTRAS = [
  { i: Snowflake, t: "Unlimited snow removal", d: "All winter, on schedule" },
  { i: Sun, t: "Lawn care all season", d: "Mow, edge, trim — fortnightly" },
  { i: Sparkles, t: "Same crew, every visit", d: "Your dedicated team" },
  { i: Crown, t: "Concierge support", d: "Direct line, no queues" },
];

const RETAINED = ["Home records", "Service history", "Receipts & invoices", "Equipment data"];
const LOST = ["AutoPilot schedules", "Member pricing", "Concierge", "Yard-care service (Complete only)"];

function UpgradePage() {
  const navigate = useNavigate();
  const { tier, isActive, loading, userId, currentPeriodEnd, cancelAtPeriodEnd } = useMembership();
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
        <AppHeader title="Checkout" subtitle="Secure annual membership" />
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
            <span className="text-xs font-semibold uppercase tracking-wider">HomeOwner Pro</span>
          </div>
          <h2 className="mt-2 font-display text-2xl font-bold">Two ways to run your home.</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Pay annually. Cancel anytime. Year 2+ earn loyalty credits toward any booking.
          </p>
        </div>

        {isActive ? (
          <div className="space-y-3 rounded-2xl border border-primary/40 bg-primary/5 p-5 text-center">
            <Crown className="mx-auto h-6 w-6 text-primary" />
            <p className="font-display text-lg font-semibold">You're on {TIER_LABELS[tier]}.</p>
            {currentPeriodEnd && (
              <p className="text-xs text-muted-foreground">
                {cancelAtPeriodEnd ? "Access ends" : "Renews"}{" "}
                {new Date(currentPeriodEnd).toLocaleDateString()}
              </p>
            )}
            <Button onClick={openPortal} disabled={portalLoading} className="w-full">
              {portalLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Manage subscription
            </Button>
            <Button variant="ghost" onClick={() => navigate({ to: "/renewal" })} className="w-full">
              See my year-in-review
            </Button>
            {tier === "premium" && (
              <Button variant="outline" onClick={() => setSelected("complete_annual")} className="w-full">
                Upgrade to Complete
              </Button>
            )}
          </div>
        ) : (
          <>
            <div className="grid gap-3 sm:grid-cols-2">
              <PlanCard
                tag="Premium"
                price="$249"
                cadence="/ year"
                tagline="Platform access + member pricing"
                features={PLATFORM_BENEFITS}
                ctaLabel="Choose Premium"
                onClick={() => setSelected("premium_annual")}
                disabled={!isPaymentsConfigured() || loading || !userId}
              />
              <PlanCard
                tag="Complete"
                price="$1,548"
                cadence="/ year"
                badge="Everything done for you"
                tagline="Premium + year-round yard care"
                features={[
                  "Everything in Premium",
                  ...COMPLETE_EXTRAS.map((e) => e.t),
                ]}
                highlight
                ctaLabel="Choose Complete"
                onClick={() => setSelected("complete_annual")}
                disabled={!isPaymentsConfigured() || loading || !userId}
              />
            </div>
            <p className="text-center text-[11px] text-muted-foreground">
              Equivalent to $21/mo (Premium) or $129/mo (Complete). Annual billing only.
            </p>
            {!userId && !loading && (
              <p className="text-center text-xs text-muted-foreground">
                <Link to="/auth" className="text-primary hover:underline">Sign in</Link> to subscribe.
              </p>
            )}
          </>
        )}

        <section className="rounded-2xl border border-border bg-card p-5 shadow-soft">
          <h3 className="font-display text-base font-semibold">What's in every tier</h3>
          <ul className="mt-3 space-y-2">
            {PLATFORM_BENEFITS.map((b) => (
              <li key={b} className="flex items-start gap-3 text-sm">
                <Check className="mt-0.5 h-4 w-4 shrink-0 text-success" />
                <span>{b}</span>
              </li>
            ))}
          </ul>
        </section>

        <section className="rounded-2xl border border-primary/30 bg-primary/5 p-5">
          <div className="flex items-center gap-2 text-primary">
            <Crown className="h-4 w-4" />
            <span className="text-xs font-semibold uppercase tracking-wider">Complete extras</span>
          </div>
          <ul className="mt-3 space-y-2">
            {COMPLETE_EXTRAS.map((b) => (
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
            <Sparkles className="h-4 w-4 text-primary" />
            <h3 className="font-display text-base font-semibold">Loyalty credits</h3>
          </div>
          <p className="mt-1 text-xs text-muted-foreground">
            Every renewal earns service credits you can apply to any booking.
          </p>
          <div className="mt-3 grid grid-cols-3 gap-2 text-center">
            <div className="rounded-xl bg-muted/40 p-3">
              <div className="text-xs text-muted-foreground">Year 2</div>
              <div className="font-display text-lg font-bold">$50</div>
            </div>
            <div className="rounded-xl bg-muted/40 p-3">
              <div className="text-xs text-muted-foreground">Year 3</div>
              <div className="font-display text-lg font-bold">$100</div>
            </div>
            <div className="rounded-xl bg-muted/40 p-3">
              <div className="text-xs text-muted-foreground">Year 4+</div>
              <div className="font-display text-lg font-bold">$150</div>
            </div>
          </div>
        </section>

        <section className="rounded-2xl border border-border bg-card p-5 shadow-soft">
          <div className="flex items-center gap-2">
            <Archive className="h-4 w-4 text-muted-foreground" />
            <h3 className="font-display text-base font-semibold">If you cancel</h3>
          </div>
          <p className="mt-1 text-xs text-muted-foreground">Your data is yours. Forever.</p>
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
  tag, price, cadence, badge, tagline, features, highlight, onClick, disabled, ctaLabel,
}: {
  tag: string;
  price: string;
  cadence: string;
  badge?: string;
  tagline: string;
  features: string[];
  highlight?: boolean;
  onClick?: () => void;
  disabled?: boolean;
  ctaLabel: string;
}) {
  return (
    <div
      className={`flex flex-col rounded-2xl border p-4 shadow-soft transition ${
        highlight ? "border-primary bg-primary/5" : "border-border bg-card"
      }`}
    >
      <div className="flex items-center justify-between">
        <span className="font-display text-sm font-semibold">{tag}</span>
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
      <ul className="mt-3 space-y-1 flex-1">
        {features.map((f) => (
          <li key={f} className="flex items-start gap-1.5 text-[12px]">
            <Check className="mt-0.5 h-3 w-3 shrink-0 text-primary" />
            <span>{f}</span>
          </li>
        ))}
      </ul>
      <Button
        onClick={onClick}
        disabled={disabled}
        variant={highlight ? "default" : "outline"}
        className="mt-4 w-full"
      >
        {ctaLabel}
      </Button>
    </div>
  );
}
