import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { CheckCircle2, Phone, ChevronDown } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth-context";
import { AppHeader } from "@/components/AppHeader";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { SEASONS, SEASONAL_TASKS, currentSeason, type Season } from "@/lib/seasonal-tasks";
import { toast } from "sonner";

export const Route = createFileRoute("/_app/calendar")({
  component: CalendarPage,
});

function CalendarPage() {
  const { user } = useAuth();
  const [season, setSeason] = useState<Season>(currentSeason());
  const [completed, setCompleted] = useState<Set<string>>(new Set());
  const [homeId, setHomeId] = useState<string | null>(null);
  const [partners, setPartners] = useState<{ id: string; name: string; category: string; phone: string | null }[]>([]);

  useEffect(() => {
    if (!user) return;
    (async () => {
      const { data: h } = await supabase.from("homes").select("id, realtor_id").eq("owner_id", user.id).maybeSingle();
      if (h) {
        setHomeId(h.id);
        if (h.realtor_id) {
          const { data: ps } = await supabase
            .from("partners")
            .select("id, name, category, phone")
            .eq("realtor_id", h.realtor_id);
          setPartners(ps ?? []);
        }
      }
      const { data: logs } = await supabase
        .from("maintenance_logs")
        .select("task_key")
        .eq("owner_id", user.id);
      setCompleted(new Set((logs ?? []).map((l: any) => l.task_key).filter(Boolean)));
    })();
  }, [user]);

  const markComplete = async (taskKey: string, title: string, performedBy: "diy" | "pro") => {
    if (!user || !homeId) return;
    const { error } = await supabase.from("maintenance_logs").insert({
      owner_id: user.id,
      home_id: homeId,
      season,
      task_key: taskKey,
      title,
      performed_by: performedBy,
    });
    if (error) {
      toast.error(error.message);
      return;
    }
    setCompleted((s) => new Set(s).add(taskKey));
    toast.success("Logged to maintenance history");
  };

  const callPro = async (taskKey: string, title: string, partnerCategory?: string) => {
    if (!user || !homeId) return;
    const match = partners.find((p) => p.category === partnerCategory);
    if (!match) {
      toast.info("No partner set up for this category yet.");
      return;
    }
    // log referral
    const { data: home } = await supabase.from("homes").select("realtor_id").eq("id", homeId).maybeSingle();
    if (home?.realtor_id) {
      await supabase.from("referrals").insert({
        homeowner_id: user.id,
        realtor_id: home.realtor_id,
        partner_id: match.id,
        category: partnerCategory!,
      });
    }
    if (match.phone) window.location.href = `tel:${match.phone}`;
    toast.success(`Connecting you with ${match.name}`);
  };

  return (
    <>
      <AppHeader title="Seasonal calendar" />
      <main className="container-app py-6">
        <Tabs value={season} onValueChange={(v) => setSeason(v as Season)}>
          <TabsList className="grid w-full grid-cols-4">
            {SEASONS.map((s) => (
              <TabsTrigger key={s.key} value={s.key} className="text-xs">{s.label}</TabsTrigger>
            ))}
          </TabsList>
          {SEASONS.map((s) => (
            <TabsContent key={s.key} value={s.key} className="mt-5 space-y-3">
              <div className={`inline-flex items-center gap-2 rounded-full px-3 py-1 text-xs font-medium ${s.tint}`}>
                {s.label} · {s.months}
              </div>
              {SEASONAL_TASKS[s.key].map((t) => {
                const done = completed.has(t.key);
                return (
                  <Collapsible key={t.key} className="rounded-2xl border border-border bg-card shadow-soft">
                    <CollapsibleTrigger id={t.key} className="flex w-full items-start gap-3 p-4 text-left">
                      {done ? (
                        <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-success" />
                      ) : (
                        <span className="mt-1 h-5 w-5 shrink-0 rounded-full border-2 border-border" />
                      )}
                      <div className="flex-1">
                        <div className={`font-medium ${done ? "text-muted-foreground line-through" : ""}`}>{t.title}</div>
                        <div className="mt-0.5 text-[11px] text-muted-foreground">
                          {t.category} · {t.diy ? "DIY-friendly" : "Pro recommended"} · {t.estCost}
                        </div>
                      </div>
                      <ChevronDown className="mt-1 h-4 w-4 text-muted-foreground transition-transform [&[data-state=open]]:rotate-180" />
                    </CollapsibleTrigger>
                    <CollapsibleContent className="border-t border-border px-4 pb-4 pt-3">
                      <p className="text-sm text-muted-foreground">{t.description}</p>
                      <ol className="mt-3 space-y-1.5 text-sm">
                        {t.steps.map((step, i) => (
                          <li key={i} className="flex gap-2">
                            <span className="grid h-5 w-5 shrink-0 place-items-center rounded-full bg-primary/10 text-[11px] font-semibold text-primary">
                              {i + 1}
                            </span>
                            <span>{step}</span>
                          </li>
                        ))}
                      </ol>
                      <div className="mt-4 flex flex-wrap gap-2">
                        <Button size="sm" onClick={() => markComplete(t.key, t.title, "diy")} disabled={done}>
                          <CheckCircle2 className="mr-1.5 h-4 w-4" /> Mark done (DIY)
                        </Button>
                        {t.callPro && (
                          <Button size="sm" variant="outline" onClick={() => callPro(t.key, t.title, t.callPro)}>
                            <Phone className="mr-1.5 h-4 w-4" /> Call a pro
                          </Button>
                        )}
                      </div>
                    </CollapsibleContent>
                  </Collapsible>
                );
              })}
            </TabsContent>
          ))}
        </Tabs>
      </main>
    </>
  );
}
