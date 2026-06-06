import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Sparkles, Repeat, Pause, Play, Trash2, Plus } from "lucide-react";
import { useServerFn } from "@tanstack/react-start";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth-context";
import { AppHeader } from "@/components/AppHeader";
import { Button } from "@/components/ui/button";
import { AUTOPILOT_PRESETS, CADENCE_LABEL, type Cadence } from "@/lib/autopilot";
import { PRO_CATEGORY_MAP } from "@/lib/pro-categories";
import { toggleAutopilotSchedule, deleteAutopilotSchedule } from "@/lib/autopilot.functions";
import { toast } from "sonner";

export const Route = createFileRoute("/_app/autopilot")({
  component: AutopilotPage,
});

interface Schedule {
  id: string;
  category: string;
  cadence: Cadence;
  next_run_at: string;
  active: boolean;
  notes: string | null;
  preferred_partner_id: string | null;
  provider: { name: string } | null;
}

function AutopilotPage() {
  const { user } = useAuth();
  const [rows, setRows] = useState<Schedule[] | null>(null);
  const toggleFn = useServerFn(toggleAutopilotSchedule);
  const deleteFn = useServerFn(deleteAutopilotSchedule);

  const load = () => {
    if (!user) return;
    (supabase as any)
      .from("autopilot_schedules")
      .select("id, category, cadence, next_run_at, active, notes, preferred_partner_id, provider:service_providers!preferred_partner_id(name)")
      .eq("owner_id", user.id)
      .order("next_run_at", { ascending: true })
      .then(({ data }: any) => setRows(data ?? []));
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  return (
    <>
      <AppHeader title="AutoPilot" subtitle="Recurring maintenance, scheduled for you" />
      <main className="container-app py-5 space-y-6 pb-32">
        <section className="rounded-2xl bg-hero p-1 shadow-glow">
          <div className="rounded-[18px] bg-card p-5">
            <div className="flex items-center gap-2 text-primary">
              <Sparkles className="h-4 w-4" />
              <span className="text-xs font-semibold uppercase tracking-wider">Set it once</span>
            </div>
            <h2 className="mt-1 font-display text-xl font-semibold">Never remember a maintenance task again.</h2>
            <p className="mt-1 text-sm text-muted-foreground">
              AutoPilot drafts the next booking with your preferred pro on schedule. Confirm with one tap.
            </p>
          </div>
        </section>

        <section>
          <h3 className="mb-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">Active schedules</h3>
          {rows === null && <p className="text-sm text-muted-foreground">Loading…</p>}
          {rows && rows.length === 0 && (
            <div className="rounded-2xl border border-dashed border-border p-6 text-center text-sm text-muted-foreground">
              No AutoPilot schedules yet. Pick a recommended one below or set one up when you book a pro.
            </div>
          )}
          <div className="space-y-2">
            {rows?.map((s) => {
              const cat = PRO_CATEGORY_MAP[s.category];
              const Icon = cat?.icon ?? Repeat;
              return (
                <div key={s.id} className="rounded-2xl border border-border bg-card p-4 shadow-soft">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-start gap-3 min-w-0">
                      <div className="grid h-9 w-9 place-items-center rounded-lg bg-primary/10 text-primary">
                        <Icon className="h-4 w-4" />
                      </div>
                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="font-medium">{cat?.label ?? s.category}</span>
                          {!s.active && <span className="rounded-full bg-muted px-2 py-0.5 text-[10px] font-semibold uppercase">Paused</span>}
                        </div>
                        <p className="text-xs text-muted-foreground">
                          {CADENCE_LABEL[s.cadence]} · next {new Date(s.next_run_at).toLocaleDateString()}
                        </p>
                        {s.provider?.name && (
                          <p className="text-xs text-muted-foreground">with {s.provider.name}</p>
                        )}
                      </div>
                    </div>
                    <div className="flex gap-1">
                      <Button
                        size="icon"
                        variant="ghost"
                        onClick={async () => {
                          await toggleFn({ data: { id: s.id, active: !s.active } });
                          load();
                        }}
                        aria-label={s.active ? "Pause" : "Resume"}
                      >
                        {s.active ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
                      </Button>
                      <Button
                        size="icon"
                        variant="ghost"
                        onClick={async () => {
                          if (!confirm("Remove this AutoPilot schedule?")) return;
                          await deleteFn({ data: { id: s.id } });
                          toast.success("Schedule removed");
                          load();
                        }}
                        aria-label="Remove"
                      >
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </section>

        <section>
          <h3 className="mb-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">Recommended for your home</h3>
          <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
            {AUTOPILOT_PRESETS.map((p) => {
              const cat = PRO_CATEGORY_MAP[p.category];
              const Icon = cat?.icon ?? Repeat;
              return (
                <Link
                  key={p.key}
                  to="/pros"
                  search={{ category: p.category } as any}
                  className="flex items-start gap-3 rounded-2xl border border-border bg-card p-3 shadow-soft transition hover:-translate-y-0.5"
                >
                  <div className="grid h-9 w-9 place-items-center rounded-lg bg-muted text-foreground">
                    <Icon className="h-4 w-4" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="text-sm font-medium">{p.label}</div>
                    <div className="text-xs text-muted-foreground">{p.blurb}</div>
                  </div>
                  <Plus className="mt-1 h-4 w-4 text-muted-foreground" />
                </Link>
              );
            })}
          </div>
        </section>
      </main>
    </>
  );
}
