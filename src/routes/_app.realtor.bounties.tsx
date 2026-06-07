import { createFileRoute, Navigate } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { Gift, Loader2, Clock, CheckCircle2, DollarSign } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth-context";
import { AppHeader } from "@/components/AppHeader";
import { Badge } from "@/components/ui/badge";
import { getStripeEnvironment } from "@/lib/stripe";

export const Route = createFileRoute("/_app/realtor/bounties")({
  component: BountiesPage,
});

interface BountyRow {
  id: string;
  homeowner_id: string;
  tier: "premium" | "complete";
  amount_cents: number;
  currency: string;
  status: "pending" | "paid" | "void";
  stripe_subscription_id: string | null;
  created_at: string;
  paid_at: string | null;
}

interface HomeownerName {
  user_id: string;
  full_name: string | null;
}

function dollars(cents: number) {
  return (cents / 100).toLocaleString("en-US", { style: "currency", currency: "USD" });
}

function BountiesPage() {
  const { session, profile, loading: authLoading } = useAuth();
  const [bounties, setBounties] = useState<BountyRow[]>([]);
  const [names, setNames] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!session) return;
    let cancelled = false;

    (async () => {
      const env = getStripeEnvironment();
      const { data } = await supabase
        .from("realtor_bounties")
        .select("id, homeowner_id, tier, amount_cents, currency, status, stripe_subscription_id, created_at, paid_at")
        .eq("realtor_id", session.user.id)
        .eq("environment", env)
        .order("created_at", { ascending: false });
      if (cancelled) return;
      const rows = (data as BountyRow[]) ?? [];
      setBounties(rows);

      const ids = Array.from(new Set(rows.map((r) => r.homeowner_id)));
      if (ids.length) {
        const { data: people } = await supabase
          .from("profiles")
          .select("user_id, full_name")
          .in("user_id", ids);
        if (!cancelled && people) {
          const map: Record<string, string> = {};
          (people as HomeownerName[]).forEach((p) => {
            map[p.user_id] = p.full_name || "Homeowner";
          });
          setNames(map);
        }
      }
      setLoading(false);
    })();

    return () => {
      cancelled = true;
    };
  }, [session]);

  const totals = useMemo(() => {
    let pending = 0,
      paid = 0,
      lifetime = 0;
    for (const b of bounties) {
      lifetime += b.amount_cents;
      if (b.status === "pending") pending += b.amount_cents;
      if (b.status === "paid") paid += b.amount_cents;
    }
    return { pending, paid, lifetime, count: bounties.length };
  }, [bounties]);

  if (authLoading) return null;
  if (!session) return <Navigate to="/auth" />;
  if (profile?.role !== "realtor") return <Navigate to="/home" />;

  return (
    <>
      <AppHeader title="Bounties" subtitle="One-time payouts per converted homeowner" />
      <main className="container-app py-6 space-y-6 pb-24">
        <div className="grid grid-cols-3 gap-3">
          <StatCard label="Pending" value={dollars(totals.pending)} icon={Clock} />
          <StatCard label="Paid" value={dollars(totals.paid)} icon={CheckCircle2} />
          <StatCard label="Lifetime" value={dollars(totals.lifetime)} icon={DollarSign} />
        </div>

        <section className="rounded-2xl border border-border bg-card p-5 shadow-soft">
          <div className="flex items-center gap-2 mb-1">
            <Gift className="h-4 w-4 text-primary" />
            <h3 className="font-display text-base font-semibold">How bounties work</h3>
          </div>
          <p className="text-xs text-muted-foreground">
            When a homeowner you referred subscribes, you earn <strong>$50</strong> on Premium or <strong>$75</strong> on Complete.
            One-time payout per household. Tracked here, paid monthly.
          </p>
        </section>

        <section>
          <h3 className="font-display text-sm font-semibold mb-2">Activity</h3>
          {loading ? (
            <div className="rounded-2xl border border-border bg-card p-8 text-center">
              <Loader2 className="mx-auto h-5 w-5 animate-spin text-muted-foreground" />
            </div>
          ) : bounties.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-border bg-card p-8 text-center text-sm text-muted-foreground">
              No bounties yet. Share your referral code from the dashboard to start.
            </div>
          ) : (
            <ul className="space-y-2">
              {bounties.map((b) => (
                <li
                  key={b.id}
                  className="flex items-center justify-between rounded-xl border border-border bg-card p-3 shadow-soft"
                >
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="font-medium text-sm truncate">{names[b.homeowner_id] || "Homeowner"}</span>
                      <Badge variant={b.tier === "complete" ? "default" : "secondary"} className="text-[10px]">
                        {b.tier === "complete" ? "Complete" : "Premium"}
                      </Badge>
                    </div>
                    <div className="text-[11px] text-muted-foreground">
                      {new Date(b.created_at).toLocaleDateString()}
                      {b.paid_at && ` · paid ${new Date(b.paid_at).toLocaleDateString()}`}
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="font-display text-base font-semibold">{dollars(b.amount_cents)}</div>
                    <StatusBadge status={b.status} />
                  </div>
                </li>
              ))}
            </ul>
          )}
        </section>
      </main>
    </>
  );
}

function StatCard({ label, value, icon: Icon }: { label: string; value: string; icon: any }) {
  return (
    <div className="rounded-2xl border border-border bg-card p-3 shadow-soft">
      <div className="flex items-center gap-1.5 text-[10px] uppercase tracking-wider text-muted-foreground">
        <Icon className="h-3 w-3" />
        {label}
      </div>
      <div className="mt-1 font-display text-lg font-bold">{value}</div>
    </div>
  );
}

function StatusBadge({ status }: { status: BountyRow["status"] }) {
  if (status === "paid") return <Badge variant="secondary" className="text-[10px] bg-emerald-100 text-emerald-700">Paid</Badge>;
  if (status === "void") return <Badge variant="outline" className="text-[10px]">Void</Badge>;
  return <Badge variant="outline" className="text-[10px]">Pending</Badge>;
}
