import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { ClipboardList, Wrench, User, DollarSign, Calendar } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth-context";
import { AppHeader } from "@/components/AppHeader";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";

export const Route = createFileRoute("/_app/logs")({
  component: LogsPage,
});

interface LogRow {
  id: string;
  title: string;
  notes: string | null;
  season: string | null;
  performed_by: string;
  cost: number | null;
  completed_at: string;
}

function LogsPage() {
  const { user } = useAuth();
  const [logs, setLogs] = useState<LogRow[]>([]);
  const [homeId, setHomeId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);

  const [title, setTitle] = useState("");
  const [performedBy, setPerformedBy] = useState("diy");
  const [cost, setCost] = useState("");
  const [notes, setNotes] = useState("");
  const [busy, setBusy] = useState(false);

  async function load() {
    if (!user) return;
    setLoading(true);
    const { data: h } = await supabase
      .from("homes")
      .select("id")
      .eq("owner_id", user.id)
      .maybeSingle();
    if (!h) {
      setLoading(false);
      return;
    }
    setHomeId(h.id);
    const { data } = await supabase
      .from("maintenance_logs")
      .select("id, title, notes, season, performed_by, cost, completed_at")
      .eq("home_id", h.id)
      .order("completed_at", { ascending: false });
    setLogs((data as LogRow[]) ?? []);
    setLoading(false);
  }

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  async function save() {
    if (!user || !homeId || !title.trim()) return;
    setBusy(true);
    const { error } = await supabase.from("maintenance_logs").insert({
      home_id: homeId,
      owner_id: user.id,
      title: title.trim(),
      notes: notes.trim() || null,
      performed_by: performedBy,
      cost: cost ? Number(cost) : null,
    });
    setBusy(false);
    if (error) {
      toast.error("Could not save log");
      return;
    }
    toast.success("Maintenance logged");
    setTitle("");
    setCost("");
    setNotes("");
    setPerformedBy("diy");
    setOpen(false);
    load();
  }

  const totalSpend = logs.reduce((s, l) => s + (l.cost ?? 0), 0);

  return (
    <>
      <AppHeader title="Maintenance log" subtitle="A record of every fix, tune-up, and inspection." />
      <main className="container-app py-6 space-y-6">
        <div className="grid grid-cols-2 gap-3">
          <div className="rounded-2xl border border-border bg-card p-4">
            <div className="text-xs text-muted-foreground">Total entries</div>
            <div className="mt-1 font-display text-2xl font-semibold">{logs.length}</div>
          </div>
          <div className="rounded-2xl border border-border bg-card p-4">
            <div className="text-xs text-muted-foreground">Lifetime spend</div>
            <div className="mt-1 font-display text-2xl font-semibold">${totalSpend.toFixed(0)}</div>
          </div>
        </div>

        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button className="w-full" size="lg">
              <ClipboardList className="mr-2 h-4 w-4" /> Log new maintenance
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Log maintenance</DialogTitle>
            </DialogHeader>
            <div className="space-y-3">
              <div>
                <label className="text-xs font-medium text-muted-foreground">What did you do?</label>
                <Input
                  placeholder="e.g. Replaced HVAC filter"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-medium text-muted-foreground">Who did it?</label>
                  <Select value={performedBy} onValueChange={setPerformedBy}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="diy">Myself (DIY)</SelectItem>
                      <SelectItem value="pro">Hired a pro</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <label className="text-xs font-medium text-muted-foreground">Cost ($)</label>
                  <Input
                    type="number"
                    placeholder="0"
                    value={cost}
                    onChange={(e) => setCost(e.target.value)}
                  />
                </div>
              </div>
              <div>
                <label className="text-xs font-medium text-muted-foreground">Notes</label>
                <Textarea
                  placeholder="Brand, model, anything to remember next time…"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  rows={3}
                />
              </div>
            </div>
            <DialogFooter>
              <Button onClick={save} disabled={busy || !title.trim()}>
                {busy ? "Saving…" : "Save entry"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        <section className="space-y-3">
          {loading ? (
            <div className="text-center text-muted-foreground py-8">Loading…</div>
          ) : logs.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-border p-8 text-center">
              <Wrench className="mx-auto h-8 w-8 text-muted-foreground" />
              <p className="mt-3 text-sm text-muted-foreground">
                No maintenance logged yet. Tap above to record your first entry.
              </p>
            </div>
          ) : (
            logs.map((l) => (
              <article
                key={l.id}
                className="rounded-2xl border border-border bg-card p-4 shadow-soft"
              >
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <h3 className="font-display text-base font-semibold">{l.title}</h3>
                    <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted-foreground">
                      <span className="inline-flex items-center gap-1">
                        <Calendar className="h-3 w-3" />
                        {new Date(l.completed_at).toLocaleDateString()}
                      </span>
                      <span className="inline-flex items-center gap-1">
                        <User className="h-3 w-3" />
                        {l.performed_by === "pro" ? "Pro" : "DIY"}
                      </span>
                      {l.cost != null && (
                        <span className="inline-flex items-center gap-1">
                          <DollarSign className="h-3 w-3" />
                          {l.cost.toFixed(2)}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
                {l.notes && (
                  <p className="mt-3 text-sm text-foreground/80">{l.notes}</p>
                )}
              </article>
            ))
          )}
        </section>
      </main>
    </>
  );
}
