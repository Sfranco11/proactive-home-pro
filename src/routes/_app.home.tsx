import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { CalendarCheck, AlertTriangle, BookOpen, Users, ChevronRight, CheckCircle2, Sparkles, Repeat, Activity } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth-context";
import { AppHeader } from "@/components/AppHeader";
import { Button } from "@/components/ui/button";
import { SEASONS, SEASONAL_TASKS, currentSeason } from "@/lib/seasonal-tasks";
import { computeHealth, getPreset, TONE_CLASS } from "@/lib/equipment";

export const Route = createFileRoute("/_app/home")({
  component: HomeDashboard,
});

interface Realtor {
  company_name: string;
  brand_color: string;
}

function HomeDashboard() {
  const { user, profile } = useAuth();
  const [realtor, setRealtor] = useState<Realtor | null>(null);
  const [logsCount, setLogsCount] = useState(0);
  const [completedKeys, setCompletedKeys] = useState<Set<string>>(new Set());
  const [equipment, setEquipment] = useState<any[]>([]);

  const season = currentSeason();
  const seasonMeta = SEASONS.find((s) => s.key === season)!;
  const tasks = SEASONAL_TASKS[season];

  useEffect(() => {
    if (!user) return;
    (async () => {
      const { data: home } = await supabase
        .from("homes")
        .select("realtor_id")
        .eq("owner_id", user.id)
        .maybeSingle();
      if (home?.realtor_id) {
        const { data: r } = await (supabase as any)
          .rpc("get_realtor_brand_by_id", { _user_id: home.realtor_id })
          .maybeSingle();
        if (r) setRealtor(r as Realtor);
      }
      const since = new Date();
      since.setMonth(since.getMonth() - 3);
      const { data: logs, count } = await supabase
        .from("maintenance_logs")
        .select("task_key", { count: "exact" })
        .eq("owner_id", user.id)
        .gte("completed_at", since.toISOString());
      setLogsCount(count ?? 0);
      setCompletedKeys(new Set((logs ?? []).map((l: any) => l.task_key).filter(Boolean)));

      const { data: eq } = await supabase
        .from("home_equipment" as any)
        .select("*")
        .eq("owner_id", user.id);
      setEquipment((eq as any) ?? []);
    })();
  }, [user]);

  const equipmentAlerts = equipment
    .map((e) => ({ eq: e, health: computeHealth(e) }))
    .filter((x) => x.health.tone === "due" || x.health.tone === "overdue" || x.health.tone === "warn")
    .sort((a, b) => a.health.pctRemaining - b.health.pctRemaining)
    .slice(0, 3);

  return (
    <>
      <AppHeader title="HomeOwner Pro" subtitle={realtor ? `via ${realtor.company_name}` : "The operating system for your home"} />
      <main className="container-app py-6 pb-24">
        {/* Hero greeting */}
        <section className="mb-6 overflow-hidden rounded-3xl bg-hero p-5 text-primary-foreground shadow-glow">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <div className="inline-flex items-center gap-1.5 rounded-full bg-white/10 px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-wider backdrop-blur">
                <CalendarCheck className="h-3 w-3" /> {seasonMeta.label}
              </div>
              <h1 className="mt-3 font-display text-2xl font-semibold leading-tight">
                Hi {profile?.full_name?.split(" ")[0] || "there"} 👋
              </h1>
              <p className="mt-1 text-sm text-primary-foreground/80">
                {tasks.filter((t) => completedKeys.has(t.key)).length}/{tasks.length} {seasonMeta.label.toLowerCase()} tasks done · {logsCount} logged in 90d
              </p>
            </div>
            <div className="grid h-14 w-14 shrink-0 place-items-center rounded-2xl bg-white/10 backdrop-blur">
              <span className="font-display text-xl font-bold text-gold">
                {Math.round((tasks.filter((t) => completedKeys.has(t.key)).length / Math.max(tasks.length, 1)) * 100)}%
              </span>
            </div>
          </div>
        </section>



        {/* Primary actions */}
        <section className="mb-6 grid grid-cols-2 gap-3">
          <Link to="/pros" className="rounded-2xl bg-hero p-1 shadow-glow">
            <div className="rounded-[14px] bg-card p-4">
              <Sparkles className="h-5 w-5 text-primary" />
              <div className="mt-3 font-display font-semibold">Book a pro</div>
              <div className="text-xs text-muted-foreground">Vetted, ranked, ready</div>
            </div>
          </Link>
          <Link to="/autopilot" className="rounded-2xl border border-border bg-card p-4 transition-colors hover:bg-accent">
            <Repeat className="h-5 w-5 text-primary" />
            <div className="mt-3 font-display font-semibold">AutoPilot</div>
            <div className="text-xs text-muted-foreground">Set recurring care</div>
          </Link>
        </section>

        {/* Emergency CTA */}
        <Link
          to="/triage"
          className="mb-6 flex items-center justify-between rounded-2xl border border-destructive/30 bg-destructive/5 p-4 transition-colors hover:bg-destructive/10"
        >
          <div className="flex items-center gap-3">
            <div className="grid h-11 w-11 place-items-center rounded-xl bg-destructive text-destructive-foreground">
              <AlertTriangle className="h-5 w-5" />
            </div>
            <div>
              <div className="font-display font-semibold">Something broke?</div>
              <div className="text-xs text-muted-foreground">Get DIY steps or call a pro now</div>
            </div>
          </div>
          <ChevronRight className="h-5 w-5 text-muted-foreground" />
        </Link>

        {/* Equipment health (Dyson-style) */}
        <section className="mb-6 rounded-2xl border border-border bg-card p-4 shadow-soft">
          <div className="mb-3 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Activity className="h-4 w-4 text-primary" />
              <h2 className="font-display text-base font-semibold">Home health</h2>
            </div>
            <Button asChild variant="ghost" size="sm">
              <Link to="/equipment">{equipment.length > 0 ? "Manage" : "Set up"} <ChevronRight className="ml-0.5 h-4 w-4" /></Link>
            </Button>
          </div>
          {equipment.length === 0 ? (
            <Link to="/equipment" className="block rounded-xl bg-background/60 p-3 text-sm hover:bg-background">
              <div className="font-medium">Track your equipment</div>
              <div className="text-[11px] text-muted-foreground">Add your furnace, AC, water heater & filters — see life remaining like a Dyson.</div>
            </Link>
          ) : equipmentAlerts.length === 0 ? (
            <div className="rounded-xl bg-success/10 p-3 text-sm">
              <div className="font-medium text-success">All {equipment.length} items healthy ✓</div>
              <div className="text-[11px] text-muted-foreground">Nothing needs attention right now.</div>
            </div>
          ) : (
            <ul className="space-y-2">
              {equipmentAlerts.map(({ eq, health }) => {
                const preset = getPreset(eq.type);
                const Icon = preset?.icon ?? Activity;
                const tone = TONE_CLASS[health.tone];
                return (
                  <li key={eq.id}>
                    <Link to="/equipment" className="block rounded-xl bg-background/60 p-3 hover:bg-background">
                      <div className="flex items-center gap-3">
                        <div className={`grid h-9 w-9 place-items-center rounded-lg ${tone.bg} ${tone.text}`}>
                          <Icon className="h-4 w-4" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex justify-between gap-2">
                            <div className="text-sm font-medium truncate">{eq.name}</div>
                            <span className={`shrink-0 text-[10px] font-semibold ${tone.text}`}>{health.label}</span>
                          </div>
                          <div className="mt-1.5 h-1.5 rounded-full bg-muted overflow-hidden">
                            <div className={`h-full ${tone.bar}`} style={{ width: `${health.pctRemaining}%` }} />
                          </div>
                        </div>
                      </div>
                    </Link>
                  </li>
                );
              })}
            </ul>
          )}
        </section>

        {/* Season card */}
        <section className="mb-6 rounded-2xl bg-card-gradient p-5 shadow-soft">
          <div className="mb-3 flex items-center justify-between">
            <div>
              <div className={`inline-flex items-center gap-2 rounded-full px-2.5 py-0.5 text-xs font-medium ${seasonMeta.tint}`}>
                <CalendarCheck className="h-3.5 w-3.5" /> {seasonMeta.label} · {seasonMeta.months}
              </div>
              <h2 className="mt-2 font-display text-lg font-semibold">This season's checklist</h2>
            </div>
            <Button asChild variant="ghost" size="sm">
              <Link to="/calendar">All <ChevronRight className="ml-0.5 h-4 w-4" /></Link>
            </Button>
          </div>
          <ul className="space-y-2">
            {tasks.slice(0, 3).map((t) => {
              const done = completedKeys.has(t.key);
              return (
                <li key={t.key}>
                  <Link
                    to="/calendar"
                    hash={t.key}
                    className="flex items-center justify-between rounded-xl bg-background/60 p-3 hover:bg-background"
                  >
                    <div className="flex items-center gap-3">
                      {done ? (
                        <CheckCircle2 className="h-5 w-5 text-success" />
                      ) : (
                        <span className="h-5 w-5 rounded-full border-2 border-border" />
                      )}
                      <div>
                        <div className={`text-sm font-medium ${done ? "text-muted-foreground line-through" : ""}`}>{t.title}</div>
                        <div className="text-[11px] text-muted-foreground">{t.category} · {t.estCost}</div>
                      </div>
                    </div>
                    <ChevronRight className="h-4 w-4 text-muted-foreground" />
                  </Link>
                </li>
              );
            })}
          </ul>
        </section>

        {/* Stats */}
        <section className="mb-6 grid grid-cols-2 gap-3">
          <div className="rounded-2xl border border-border bg-card p-4">
            <div className="text-xs text-muted-foreground">Tasks logged (90d)</div>
            <div className="mt-1 font-display text-2xl font-semibold">{logsCount}</div>
          </div>
          <div className="rounded-2xl border border-border bg-card p-4">
            <div className="text-xs text-muted-foreground">Season progress</div>
            <div className="mt-1 font-display text-2xl font-semibold">
              {tasks.filter((t) => completedKeys.has(t.key)).length}/{tasks.length}
            </div>
          </div>
        </section>

        {/* Quick links */}
        <section className="grid grid-cols-2 gap-3">
          {[
            { to: "/systems", i: BookOpen, t: "Systems guide", d: "Shutoffs & lifespans" },
            { to: "/partners", i: Users, t: "Your pros", d: "Vetted partners" },
          ].map((q) => (
            <Link key={q.to} to={q.to} className="rounded-2xl border border-border bg-card p-4 transition-colors hover:bg-accent">
              <q.i className="h-5 w-5 text-primary" />
              <div className="mt-3 font-medium">{q.t}</div>
              <div className="text-xs text-muted-foreground">{q.d}</div>
            </Link>
          ))}
        </section>
      </main>
    </>
  );
}
