import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { ArrowLeft, Download, DollarSign, CheckCircle2, Clock, TrendingUp } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth-context";
import { useServerFn } from "@tanstack/react-start";
import { AppHeader } from "@/components/AppHeader";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { setBookingPrice, setProviderCommission } from "@/lib/bookings.functions";

export const Route = createFileRoute("/_app/realtor/revenue")({
  component: RealtorRevenue,
});

interface BookingRow {
  id: string;
  status: string;
  category: string;
  created_at: string;
  price: number | null;
  commission_rate: number;
  commission_amount: number | null;
  commission_status: string;
  provider: { id: string; name: string } | null;
}

interface RateRow {
  provider_id: string;
  rate: number;
}

function RealtorRevenue() {
  const { user, profile } = useAuth();
  const [bookings, setBookings] = useState<BookingRow[] | null>(null);
  const [rates, setRates] = useState<RateRow[]>([]);
  const updateBooking = useServerFn(setBookingPrice);
  const updateRate = useServerFn(setProviderCommission);

  const load = () => {
    if (!user) return;
    (supabase as any)
      .from("bookings")
      .select(
        "id, status, category, created_at, price, commission_rate, commission_amount, commission_status, provider:service_providers(id, name)",
      )
      .eq("realtor_id", user.id)
      .order("created_at", { ascending: false })
      .then(({ data }: any) => setBookings(data ?? []));
    (supabase as any)
      .from("realtor_commission_rates")
      .select("provider_id, rate")
      .eq("realtor_id", user.id)
      .then(({ data }: any) => setRates(data ?? []));
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  const kpi = useMemo(() => {
    const all = bookings ?? [];
    const completed = all.filter((b) => b.status === "completed");
    const revenue = completed.reduce((s, b) => s + Number(b.price ?? 0), 0);
    const commissionPaid = all
      .filter((b) => b.commission_status === "paid")
      .reduce((s, b) => s + Number(b.commission_amount ?? 0), 0);
    const commissionPending = all
      .filter((b) => b.commission_status === "pending" && b.status === "completed")
      .reduce((s, b) => s + Number(b.commission_amount ?? 0), 0);
    const conversion = all.length ? Math.round((completed.length / all.length) * 100) : 0;
    return {
      referrals: all.length,
      completed: completed.length,
      revenue,
      commissionPaid,
      commissionPending,
      conversion,
    };
  }, [bookings]);

  const providers = useMemo(() => {
    const map = new Map<string, { id: string; name: string; rate: number }>();
    (bookings ?? []).forEach((b) => {
      if (b.provider && !map.has(b.provider.id)) {
        const r = rates.find((x) => x.provider_id === b.provider!.id);
        map.set(b.provider.id, { id: b.provider.id, name: b.provider.name, rate: r ? Number(r.rate) : 10 });
      }
    });
    return Array.from(map.values());
  }, [bookings, rates]);

  const exportCsv = () => {
    const rows = [
      ["Date", "Provider", "Category", "Status", "Price", "Rate %", "Commission", "Commission Status"],
      ...(bookings ?? []).map((b) => [
        new Date(b.created_at).toISOString().slice(0, 10),
        b.provider?.name ?? "",
        b.category,
        b.status,
        b.price ?? "",
        b.commission_rate,
        b.commission_amount ?? "",
        b.commission_status,
      ]),
    ];
    const csv = rows.map((r) => r.map((v) => `"${String(v).replace(/"/g, '""')}"`).join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `commission-report-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  if (profile?.role !== "realtor") {
    return (
      <>
        <AppHeader title="Revenue" />
        <main className="container-app py-6">
          <p className="text-sm text-muted-foreground">Realtor accounts only.</p>
        </main>
      </>
    );
  }

  return (
    <>
      <AppHeader title="Revenue" subtitle="Bookings & commissions across your network" />
      <main className="container-app py-5 space-y-5 pb-32">
        <Link to="/realtor" className="inline-flex items-center gap-1 text-xs font-medium text-muted-foreground hover:text-foreground">
          <ArrowLeft className="h-3.5 w-3.5" /> Dashboard
        </Link>

        {/* KPIs */}
        <section className="grid grid-cols-2 gap-3">
          <Kpi icon={<TrendingUp className="h-4 w-4" />} label="Referrals" value={String(kpi.referrals)} />
          <Kpi icon={<CheckCircle2 className="h-4 w-4" />} label="Completed" value={`${kpi.completed} (${kpi.conversion}%)`} />
          <Kpi icon={<DollarSign className="h-4 w-4" />} label="Revenue generated" value={`$${kpi.revenue.toFixed(0)}`} />
          <Kpi icon={<Clock className="h-4 w-4" />} label="Commission pending" value={`$${kpi.commissionPending.toFixed(0)}`} />
          <div className="col-span-2">
            <Kpi icon={<DollarSign className="h-4 w-4" />} label="Commission paid" value={`$${kpi.commissionPaid.toFixed(0)}`} />
          </div>
        </section>

        {/* Per-provider rate */}
        <section className="rounded-2xl border border-border bg-card p-5 shadow-soft">
          <h2 className="font-display text-lg font-semibold">Commission rates</h2>
          <p className="mt-1 text-xs text-muted-foreground">Override the default 10% per provider. Applies to new bookings.</p>
          <div className="mt-3 space-y-2">
            {providers.length === 0 && <p className="text-xs text-muted-foreground">No bookings to set rates for yet.</p>}
            {providers.map((p) => (
              <ProviderRateRow
                key={p.id}
                provider={p}
                onSave={async (rate) => {
                  await updateRate({ data: { provider_id: p.id, rate } });
                  toast.success("Rate saved");
                  load();
                }}
              />
            ))}
          </div>
        </section>

        {/* Payout table */}
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
                onSave={async (patch) => {
                  await updateBooking({ data: { id: b.id, ...patch } });
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
      <div className="flex items-center gap-2 text-xs text-muted-foreground">
        {icon}
        {label}
      </div>
      <p className="mt-2 font-display text-2xl font-semibold">{value}</p>
    </div>
  );
}

function ProviderRateRow({
  provider,
  onSave,
}: {
  provider: { id: string; name: string; rate: number };
  onSave: (rate: number) => Promise<void>;
}) {
  const [rate, setRate] = useState(String(provider.rate));
  return (
    <div className="flex items-center justify-between gap-2 rounded-xl border border-border bg-background p-2.5">
      <span className="truncate text-sm">{provider.name}</span>
      <div className="flex items-center gap-2">
        <Input
          type="number"
          min={0}
          max={100}
          step={0.1}
          value={rate}
          onChange={(e) => setRate(e.target.value)}
          className="h-8 w-20"
        />
        <span className="text-xs text-muted-foreground">%</span>
        <Button size="sm" variant="outline" onClick={() => onSave(Number(rate))}>Save</Button>
      </div>
    </div>
  );
}

function BookingPayoutRow({
  booking,
  onSave,
}: {
  booking: BookingRow;
  onSave: (patch: { price: number | null; commission_status?: "pending" | "paid" | "waived" }) => Promise<void>;
}) {
  const [price, setPrice] = useState(booking.price != null ? String(booking.price) : "");
  const [cstatus, setCstatus] = useState(booking.commission_status);
  return (
    <div className="rounded-xl border border-border bg-background p-3 text-sm">
      <div className="flex items-center justify-between gap-2">
        <div className="min-w-0">
          <p className="truncate font-medium">{booking.provider?.name ?? "Provider"}</p>
          <p className="text-xs text-muted-foreground">
            {booking.category} · {new Date(booking.created_at).toLocaleDateString()} · {booking.status}
          </p>
        </div>
        <span className="text-xs text-muted-foreground">{booking.commission_rate}%</span>
      </div>
      <div className="mt-2 grid grid-cols-[1fr_auto_auto] items-center gap-2">
        <Input
          type="number"
          min={0}
          step={0.01}
          placeholder="Price $"
          value={price}
          onChange={(e) => setPrice(e.target.value)}
          className="h-8"
        />
        <Select value={cstatus} onValueChange={setCstatus}>
          <SelectTrigger className="h-8 w-28"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="pending">Pending</SelectItem>
            <SelectItem value="paid">Paid</SelectItem>
            <SelectItem value="waived">Waived</SelectItem>
          </SelectContent>
        </Select>
        <Button
          size="sm"
          variant="outline"
          onClick={() =>
            onSave({
              price: price === "" ? null : Number(price),
              commission_status: cstatus as "pending" | "paid" | "waived",
            })
          }
        >
          Save
        </Button>
      </div>
    </div>
  );
}
