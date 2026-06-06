import { createFileRoute, Link } from "@tanstack/react-router";
import { Crown, Check } from "lucide-react";
import { AppHeader } from "@/components/AppHeader";
import { Button } from "@/components/ui/button";

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

function UpgradePage() {
  return (
    <>
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

        <div className="grid gap-3 sm:grid-cols-2">
          <PlanCard plan="Monthly" price="$9.99" cadence="/ month" badge="7-day free trial" />
          <PlanCard plan="Annual" price="$79" cadence="/ year" badge="Save 34%" highlight />
        </div>

        <Button size="lg" className="w-full" disabled>
          Checkout coming soon
        </Button>
        <p className="text-center text-[11px] text-muted-foreground">
          Stripe checkout activates in the next update.{" "}
          <Link to="/pros" className="text-primary hover:underline">
            Browse free pros
          </Link>{" "}
          in the meantime.
        </p>
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
}: {
  plan: string;
  price: string;
  cadence: string;
  badge: string;
  highlight?: boolean;
}) {
  return (
    <div
      className={`rounded-2xl border p-4 shadow-soft ${
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
    </div>
  );
}
