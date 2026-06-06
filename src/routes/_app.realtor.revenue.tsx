import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { ArrowLeft, Download, DollarSign, CheckCircle2, Clock, TrendingUp } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth-context";
import { useServerFn } from "@tanstack/react-start";
import { AppHeader } from "@/components/AppHeader";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { setBookingPrice, setProviderCommission } from "@/lib/bookings.functions";
import { PRO_CATEGORIES } from "@/lib/pro-categories";

export const Route = createFileRoute("/_app/realtor/revenue")({
  component: RealtorRevenue,
});

interface BookingRow {
  id: string;
  status: string;
  category: string;
  created_at: string;
  final_cost: number | null;
  provider: { id: string; name: string } | null;
}

interface RateRow {
  category: string;
  rate_percent: number;
}

const DEFAULT_RATE = 10;

function RealtorRevenue() {
  const { user } = useAuth();
  const [bookings, setBookings] = useState<BookingRow[] | null>(null);
  const [rates, setRates] = useState<RateRow[]>([]);
  const updateBooking = useServerFn(setBookingPrice);
  const updateRate = useServerFn(setProviderCommission);

  const load = () => {
    if (!user) return;
    (supabase as any)
      .from("bookings")
      .select("id, status, category, created_at, final_cost, provider:service_providers(id, name)")
      .eq("realtor_id", user.id)
      .order("created_at", { ascending: false })
      .then(({ data }: any) => setBookings(data ?? []));
    (supabase as any)
      .from("realtor_commission_rates")
      .select("category, rate_percent")
      .eq("realtor_id", user.id)
      .then(({ data }: any) => setRates(data ?? []));
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  const rateMap = useMemo(() => {
    const m = new Map<string, number>();
    rates.forEach((r) => m.set(r.category, Number(r.rate_percent)));
    return m;
  }, [rates]);

  const kpi = useMemo(() => {
    const all = bookings ?? [];
    const completed = all.filter((b) => b.status === "completed");
    const revenue = completed.reduce((s, b) => s + Number(b.final_cost ?? 0), 0);
    const commissionEarned = completed.reduce((s, b) => {
      const rate = rateMap.get(b.category) ?? DEFAULT_RATE;
      return s + Number(b.final_cost ?? 0) * (rate / 100);
    }, 0);
    const conversion = all.length ? Math.round((completed.length / all.length) * 100) : 0;
    return {
      referrals: all.length,
      completed: completed.length,
      revenue,
      commissionEarned,
      conversion,
    };
  }, [bookings, rateMap]);

  const exportCsv = () => {
    if (!bookings?.length) return;
    const header = ["Date", "Provider", "Category", "Status", "Final cost", "Commission %", "Commission $"];
    const rows = bookings.map((b) => {
      const rate = rateMap.get(b.category) ?? DEFAULT_RATE;
      const commission = b.status === "completed" ? Number(b.final_cost ?? 0) * (rate / 100) : 0;
      return [
        new Date(b.created_at).toISOString().slice(0, 10),
        b.provider?.name ?? "",
        b.category,
        b.status,
        Number(b.final_cost ?? 0).toFixed(2),
        rate.toFixed(1),
        commission.toFixed(2),
      ];
    });
    const csv = [header, ...rows].map((r) => r.map((c) => `"${String(c).replace(/"/g, '""')}"`).join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url; a.download = "revenue.csv"; a.click();
    URL.revokeObjectURL(url);
  };

  const fmt = (n: number) => `$${n.toLocaleString(undefined, { maximumFractionDigits: 0 })}`;

  return (
    <>
      <AppHeader title="Revenue" subtitle="Bookings & commissions from your homeowners" />
      <main className="container-app py-5 space-y-5 pb-32">
        <Link to="/realtor" className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground">
          <ArrowLeft className="h-3.5 w-3.5" /> Realtor home
        </Link>

        <div className="grid grid-cols-2 gap-3">
          <Kpi icon={<TrendingUp className="h-4 w-4" />} label="Referrals" value={String(kpi.referrals)} />
          <Kpi icon={<CheckCircle2 className="h-4 w-4" />} label="Completed" value={String(kpi.completed)} />
          <Kpi icon={<DollarSign className="h-4 w-4" />} label="Service revenue" value={fmt(kpi.revenue)} />
          <Kpi icon={<Clock className="h-4 w-4" />} label="Commission earned" value={fmt(kpi.commissionEarned)} />
        </div>

        <section className="rounded-2xl border border-border bg-card p-5 shadow-soft">
          <h2 className="font-display text-lg font-semibold">Commission rates by category</h2>
          <p className="mt-1 text-xs text-muted-foreground">Default {DEFAULT_RATE}%. Override per category.</p>
          <div className="mt-3 space-y-2">
            {PRO_CATEGORIES.map((c) => (
              <CategoryRateRow
                key={c.key}
                label={c.label}
                value={rateMap.get(c.key) ?? DEFAULT_RATE}
                onSave={async (rate) => {
                  await updateRate({ data: { category: c.key, rate } });
                  toast.success("Rate saved");
                  load();
                }}
              />
            ))}
          </div>
        </section>

        <section className="rounded-2xl border border-border bg-card p-5 shadow-soft">
          <div className="flex items-center justify-between">
            <h2 className="font-display text-lg font-semibold">Bookings</h2>
            <Button size="sm" variant="outline" onClick={exportCsv}>
              <Download className="mr-1 h-3.5 w-3.5" /> CSV
            </Button>
          </div>
          <div className="mt-3 space-y-2">
            {bookings === null && <p className="text-xs text-muted-foreground">Loading…</p>}
            {bookings && bookings.length === 0 && (
              <p className="text-xs text-muted-foreground">Bookings from your homeowners will appear here.</p>
            )}
            {bookings?.map((b) => (
              <BookingPayoutRow
                key={b.id}
                booking={b}
                rate={rateMap.get(b.category) ?? DEFAULT_RATE}
                onSave={async (price) => {
                  await updateBooking({ data: { id: b.id, price } });
                  toast.success("Updated");
                  load();
                }}
              />
            ))}
          </div>
        </section>
      </main>
    </>
  );
}

function Kpi({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-border bg-card p-4 shadow-soft">
      <div className="flex items-center gap-2 text-xs text-muted-foreground">{icon}{label}</div>
      <p className="mt-2 font-display text-2xl font-semibold">{value}</p>
    </div>
  );
}

function CategoryRateRow({ label, value, onSave }: { label: string; value: number; onSave: (rate: number) => Promise<void> }) {
  const [rate, setRate] = useState(String(value));
  useEffect(() => setRate(String(value)), [value]);
  return (
    <div className="flex items-center justify-between gap-2 rounded-xl border border-border bg-background p-2.5">
      <span className="truncate text-sm">{label}</span>
      <div className="flex items-center gap-2">
        <Input type="number" min={0} max={100} step={0.1} value={rate} onChange={(e) => setRate(e.target.value)} className="h-8 w-20" />
        <span className="text-xs text-muted-foreground">%</span>
        <Button size="sm" variant="outline" onClick={() => onSave(Number(rate))}>Save</Button>
      </div>
    </div>
  );
}

function BookingPayoutRow({ booking, rate, onSave }: { booking: BookingRow; rate: number; onSave: (price: number | null) => Promise<void> }) {
  const [price, setPrice] = useState(booking.final_cost != null ? String(booking.final_cost) : "");
  return (
    <div className="rounded-xl border border-border bg-background p-3 text-sm">
      <div className="flex items-center justify-between gap-2">
        <div className="min-w-0">
          <p className="truncate font-medium">{booking.provider?.name ?? "Provider"}</p>
          <p className="text-xs text-muted-foreground">
            {booking.category} · {new Date(booking.created_at).toLocaleDateString()} · {booking.status}
          </p>
        </div>
        <span className="text-xs text-muted-foreground">{rate}%</span>
      </div>
      <div className="mt-2 grid grid-cols-[1fr_auto] items-center gap-2">
        <Input type="number" min={0} step={0.01} placeholder="Final cost $" value={price} onChange={(e) => setPrice(e.target.value)} className="h-8" />
        <Button size="sm" variant="outline" onClick={() => onSave(price === "" ? null : Number(price))}>Save</Button>
      </div>
    </div>
  );
}
