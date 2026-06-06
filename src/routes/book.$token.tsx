import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Home, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";

export const Route = createFileRoute("/book/$token")({
  component: ProUpdatePage,
});

const STATUSES = [
  "contacted",
  "scheduled",
  "confirmed",
  "on_the_way",
  "arrived",
  "in_progress",
  "completed",
  "cancelled",
] as const;

interface Loaded {
  booking: {
    id: string;
    status: string;
    category: string;
    service_type: string;
    scheduled_at: string | null;
    price: number | null;
    eta_minutes: number | null;
    notes: string | null;
  };
  provider: { name: string; category: string } | null;
  events: { kind: string; status: string | null; message: string | null; created_at: string }[];
}

function ProUpdatePage() {
  const { token } = Route.useParams();
  const [data, setData] = useState<Loaded | null>(null);
  const [notFound, setNotFound] = useState(false);
  const [status, setStatus] = useState<string>("");
  const [eta, setEta] = useState<string>("");
  const [price, setPrice] = useState<string>("");
  const [message, setMessage] = useState<string>("");
  const [busy, setBusy] = useState(false);

  const load = async () => {
    const res = await fetch(`/api/public/bookings/${token}`);
    if (res.status === 404) {
      setNotFound(true);
      return;
    }
    const json: Loaded = await res.json();
    setData(json);
    setStatus("");
    setEta("");
    setPrice("");
    setMessage("");
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token]);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!status && !eta && !price && !message) {
      toast.error("Enter at least one update");
      return;
    }
    setBusy(true);
    const body: Record<string, unknown> = {};
    if (status) body.status = status;
    if (eta) body.eta_minutes = Number(eta);
    if (price) body.price = Number(price);
    if (message) body.message = message;
    const res = await fetch(`/api/public/bookings/${token}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    setBusy(false);
    if (!res.ok) {
      const j = await res.json().catch(() => ({}));
      toast.error(j.error ?? "Update failed");
      return;
    }
    toast.success("Update sent to homeowner");
    load();
  };

  if (notFound) {
    return (
      <main className="container-app grid min-h-screen place-items-center text-center">
        <div>
          <h1 className="font-display text-2xl font-semibold">Link not valid</h1>
          <p className="mt-2 text-sm text-muted-foreground">Ask the homeowner to resend the booking link.</p>
        </div>
      </main>
    );
  }
  if (!data) {
    return (
      <main className="grid min-h-screen place-items-center">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </main>
    );
  }

  return (
    <div className="min-h-screen bg-background pb-12">
      <header className="border-b border-border bg-card">
        <div className="container-app flex items-center gap-3 py-4">
          <div className="grid h-10 w-10 place-items-center rounded-xl bg-primary text-primary-foreground">
            <Home className="h-5 w-5" />
          </div>
          <div>
            <p className="text-xs text-muted-foreground">Pro update portal</p>
            <h1 className="font-display text-lg font-semibold">{data.provider?.name ?? "Booking"}</h1>
          </div>
        </div>
      </header>
      <main className="container-app py-6 space-y-5">
        <section className="rounded-2xl border border-border bg-card p-4 text-sm shadow-soft">
          <p><span className="text-muted-foreground">Category: </span>{data.booking.category}</p>
          <p><span className="text-muted-foreground">Current status: </span><span className="font-medium capitalize">{data.booking.status.replace(/_/g, " ")}</span></p>
          {data.booking.scheduled_at && (
            <p><span className="text-muted-foreground">Scheduled: </span>{new Date(data.booking.scheduled_at).toLocaleString()}</p>
          )}
          {data.booking.notes && (
            <p className="mt-2 rounded-lg bg-muted p-2 text-xs">{data.booking.notes}</p>
          )}
        </section>

        <form onSubmit={submit} className="space-y-4 rounded-2xl border border-border bg-card p-5 shadow-soft">
          <h2 className="font-display text-lg font-semibold">Post an update</h2>
          <div className="space-y-2">
            <Label>Status</Label>
            <Select value={status} onValueChange={setStatus}>
              <SelectTrigger><SelectValue placeholder="Update status" /></SelectTrigger>
              <SelectContent>
                {STATUSES.map((s) => (
                  <SelectItem key={s} value={s}>{s.replace(/_/g, " ")}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label>ETA (minutes)</Label>
              <Input type="number" min={0} max={600} value={eta} onChange={(e) => setEta(e.target.value)} placeholder="15" />
            </div>
            <div className="space-y-2">
              <Label>Price ($)</Label>
              <Input type="number" min={0} step={0.01} value={price} onChange={(e) => setPrice(e.target.value)} placeholder="120" />
            </div>
          </div>
          <div className="space-y-2">
            <Label>Message to homeowner</Label>
            <Input value={message} onChange={(e) => setMessage(e.target.value)} maxLength={1000} placeholder="On my way, ~10 min out" />
          </div>
          <Button type="submit" disabled={busy} className="w-full" size="lg">
            {busy ? "Sending…" : "Send update"}
          </Button>
        </form>

        <section className="rounded-2xl border border-border bg-card p-4 shadow-soft">
          <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">History</h3>
          <ul className="mt-3 space-y-2 text-sm">
            {data.events.length === 0 && <li className="text-xs text-muted-foreground">No activity yet.</li>}
            {data.events.map((ev, i) => (
              <li key={i} className="flex justify-between gap-3 border-b border-border/60 py-1.5 last:border-b-0">
                <span>
                  {ev.kind === "status_change" && <span className="font-medium capitalize">{ev.status?.replace(/_/g, " ")}</span>}
                  {ev.kind === "eta_update" && <span>{ev.message}</span>}
                  {ev.kind === "note" && <span>{ev.message}</span>}
                  {ev.kind === "photo" && <span className="text-muted-foreground">Photo added</span>}
                </span>
                <span className="text-xs text-muted-foreground">{new Date(ev.created_at).toLocaleString()}</span>
              </li>
            ))}
          </ul>
        </section>
      </main>
    </div>
  );
}
