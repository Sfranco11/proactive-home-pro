import { createFileRoute, Link, Navigate } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { Crown, Sparkles, BookCheck, DollarSign, Wrench, Gift, Repeat, ArrowRight, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth-context";
import { AppHeader } from "@/components/AppHeader";
import { Button } from "@/components/ui/button";
import { useMembership } from "@/hooks/useMembership";
import { getStripeEnvironment } from "@/lib/stripe";
import { TIER_LABELS, TIER_PRICE_CENTS } from "@/lib/membership";

export const Route = createFileRoute("/_app/renewal")({
  component: RenewalPage,
});

interface RenewalStats {
  bookingsCompleted: number;
  totalSpent: number;
  equipmentTracked: number;
  autopilotActive: number;
  creditsActive: number;
}

function dollars(n: number) {
  return n.toLocaleString("en-US", { style: "currency", currency: "USD" });
}

function RenewalPage() {
  const { session, loading: authLoading } = useAuth();
  const { tier, isActive, createdAt, currentPeriodEnd, loading: memLoading } = useMembership();
  const [stats, setStats] = useState<RenewalStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!session) return;
    let cancelled = false;

    (async () => {
      const env = getStripeEnvironment();
      const uid = session.user.id;

      const [bookingsRes, invoicesRes, equipRes, autopilotRes, creditsRes] = await Promise.all([
        supabase
          .from("bookings")
          .select("id", { count: "exact", head: true })
          .eq("owner_id", uid)
          .eq("status", "completed"),
        supabase
          .from("invoices")
          .select("amount")
          .eq("owner_id", uid)
          .eq("status", "paid"),
        supabase
          .from("home_equipment")
          .select("id", { count: "exact", head: true })
          .eq("owner_id", uid),
        supabase
          .from("autopilot_schedules")
          .select("id", { count: "exact", head: true })
          .eq("owner_id", uid)
          .eq("active", true),
        supabase
          .from("loyalty_credits")
          .select("amount_cents")
          .eq("owner_id", uid)
          .eq("environment", env)
          .eq("status", "active"),
      ]);

      if (cancelled) return;

      const totalSpent = (invoicesRes.data ?? []).reduce(
        (sum: number, r: any) => sum + Number(r.amount ?? 0),
        0,
      );
      const creditsActive = (creditsRes.data ?? []).reduce(
        (sum: number, r: any) => sum + Number(r.amount_cents ?? 0),
        0,
      );

      setStats({
        bookingsCompleted: bookingsRes.count ?? 0,
        totalSpent,
        equipmentTracked: equipRes.count ?? 0,
        autopilotActive: autopilotRes.count ?? 0,
        creditsActive,
      });
      setLoading(false);
    })();

    return () => {
      cancelled = true;
    };
  }, [session]);

  const { memberYear, daysToRenewal, retailValue, savings } = useMemo(() => {
    if (!createdAt || !stats) {
      return { memberYear: 0, daysToRenewal: null as number | null, retailValue: 0, savings: 0 };
    }
    const startedMs = new Date(createdAt).getTime();
    const yearsElapsed = Math.floor((Date.now() - startedMs) / (365.25 * 24 * 3600 * 1000));
    const memberYear = yearsElapsed + 1;
    const daysToRenewal = currentPeriodEnd
      ? Math.max(0, Math.ceil((new Date(currentPeriodEnd).getTime() - Date.now()) / (24 * 3600 * 1000)))
      : null;

    // Assume retail markup of ~20% off vs non-member rates
    const retailValue = stats.totalSpent * 1.2;
    const savings = retailValue - stats.totalSpent;
    return { memberYear, daysToRenewal, retailValue, savings };
  }, [createdAt, currentPeriodEnd, stats]);

  if (authLoading) return null;
  if (!session) return <Navigate to="/auth" />;

  return (
    <>
      <AppHeader title="Your year-in-review" subtitle="What you got from your membership" />
      <main className="container-app py-6 space-y-6 pb-24">
        {loading || memLoading || !stats ? (
          <div className="flex justify-center py-16">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        ) : !isActive ? (
          <NotMemberCTA />
        ) : (
          <>
            <div className="rounded-2xl border border-primary/30 bg-gradient-to-br from-primary/15 via-primary/5 to-card p-6 shadow-soft text-center">
              <Crown className="mx-auto h-7 w-7 text-primary" />
              <p className="mt-2 text-xs uppercase tracking-wider text-muted-foreground">
                {TIER_LABELS[tier]} member · Year {memberYear}
              </p>
              <h2 className="mt-1 font-display text-3xl font-bold">Here's your year.</h2>
              {daysToRenewal !== null && (
                <p className="mt-2 text-sm text-muted-foreground">
                  Renews in <strong>{daysToRenewal} {daysToRenewal === 1 ? "day" : "days"}</strong>
                </p>
              )}
            </div>

            <div className="grid grid-cols-2 gap-3">
              <BigStat icon={BookCheck} label="Jobs done" value={String(stats.bookingsCompleted)} />
              <BigStat icon={DollarSign} label="Spent through us" value={dollars(stats.totalSpent)} />
              <BigStat icon={Wrench} label="Equipment tracked" value={String(stats.equipmentTracked)} />
              <BigStat icon={Repeat} label="Active schedules" value={String(stats.autopilotActive)} />
            </div>

            {stats.totalSpent > 0 && (
              <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-5 shadow-soft">
                <div className="flex items-center gap-2 text-emerald-700">
                  <Sparkles className="h-4 w-4" />
                  <span className="text-xs font-semibold uppercase tracking-wider">Member savings</span>
                </div>
                <div className="mt-2 flex items-baseline gap-2">
                  <span className="font-display text-3xl font-bold text-emerald-900">{dollars(savings)}</span>
                  <span className="text-xs text-emerald-700">vs retail ({dollars(retailValue)})</span>
                </div>
                <p className="mt-1 text-xs text-emerald-800/80">
                  Based on ~20% member pricing on every job booked through HomeOwner Pro.
                </p>
              </div>
            )}

            {stats.creditsActive > 0 && (
              <div className="rounded-2xl border border-primary/40 bg-primary/5 p-5 shadow-soft">
                <div className="flex items-center gap-2 text-primary">
                  <Gift className="h-4 w-4" />
                  <span className="text-xs font-semibold uppercase tracking-wider">Loyalty credits</span>
                </div>
                <div className="mt-2 font-display text-3xl font-bold">{dollars(stats.creditsActive / 100)}</div>
                <p className="mt-1 text-xs text-muted-foreground">
                  Available to apply to any booking. Use them or they expire one year after grant.
                </p>
                <Button asChild size="sm" className="mt-3">
                  <Link to="/pros">
                    Book a service <ArrowRight className="ml-1 h-3.5 w-3.5" />
                  </Link>
                </Button>
              </div>
            )}

            <div className="rounded-2xl border border-border bg-card p-5 shadow-soft">
              <h3 className="font-display text-base font-semibold">Your membership</h3>
              <div className="mt-3 space-y-2 text-sm">
                <Row label="Plan" value={TIER_LABELS[tier]} />
                <Row label="Annual price" value={dollars(TIER_PRICE_CENTS[tier as "premium" | "complete"] / 100)} />
                <Row label="Member since" value={createdAt ? new Date(createdAt).toLocaleDateString() : "—"} />
                {currentPeriodEnd && (
                  <Row label="Next renewal" value={new Date(currentPeriodEnd).toLocaleDateString()} />
                )}
              </div>
              <Button asChild variant="outline" className="mt-4 w-full">
                <Link to="/upgrade">Manage membership</Link>
              </Button>
            </div>
          </>
        )}
      </main>
    </>
  );
}

function BigStat({ icon: Icon, label, value }: { icon: any; label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-border bg-card p-4 shadow-soft">
      <Icon className="h-4 w-4 text-primary" />
      <div className="mt-2 font-display text-2xl font-bold">{value}</div>
      <div className="text-[11px] uppercase tracking-wider text-muted-foreground">{label}</div>
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between border-b border-border/60 pb-1.5 last:border-0">
      <span className="text-muted-foreground">{label}</span>
      <span className="font-medium">{value}</span>
    </div>
  );
}

function NotMemberCTA() {
  return (
    <div className="rounded-2xl border border-border bg-card p-8 text-center shadow-soft">
      <Crown className="mx-auto h-8 w-8 text-primary" />
      <h2 className="mt-3 font-display text-xl font-bold">Become a member first</h2>
      <p className="mt-1 text-sm text-muted-foreground">
        Your year-in-review unlocks once you join Premium or Complete.
      </p>
      <Button asChild className="mt-4">
        <Link to="/upgrade">See plans</Link>
      </Button>
    </div>
  );
}
