import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { AlertTriangle, Phone, ArrowLeft, Sparkles } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth-context";
import { AppHeader } from "@/components/AppHeader";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { TRIAGE_ISSUES, PARTNER_CATEGORIES } from "@/lib/home-systems";
import { toast } from "sonner";

export const Route = createFileRoute("/_app/triage")({
  component: TriagePage,
});

interface Partner {
  id: string;
  name: string;
  category: string;
  phone: string | null;
  response_time: string | null;
}

function TriagePage() {
  const { user } = useAuth();
  const [step, setStep] = useState<"pick" | "detail" | "result">("pick");
  const [issueKey, setIssueKey] = useState<string | null>(null);
  const [description, setDescription] = useState("");
  const [homeId, setHomeId] = useState<string | null>(null);
  const [realtorId, setRealtorId] = useState<string | null>(null);
  const [partners, setPartners] = useState<Partner[]>([]);
  const [busy, setBusy] = useState(false);
  const [match, setMatch] = useState<Partner | null>(null);

  useEffect(() => {
    if (!user) return;
    (async () => {
      const { data: h } = await supabase.from("homes").select("id, realtor_id").eq("owner_id", user.id).maybeSingle();
      if (!h) return;
      setHomeId(h.id);
      setRealtorId(h.realtor_id);
      if (h.realtor_id) {
        const { data: ps } = await supabase
          .from("partners")
          .select("id, name, category, phone, response_time")
          .eq("realtor_id", h.realtor_id);
        setPartners(ps ?? []);
      }
    })();
  }, [user]);

  const issue = TRIAGE_ISSUES.find((i) => i.key === issueKey);

  const dispatch = async () => {
    if (!user || !homeId || !issue) return;
    setBusy(true);
    const { data: triage } = await supabase
      .from("triage_requests")
      .insert({
        owner_id: user.id,
        home_id: homeId,
        category: issue.category,
        description,
        severity: issue.severity,
      })
      .select("id")
      .single();

    const partner = partners.find((p) => p.category === issue.category) ?? null;
    if (partner && realtorId && triage) {
      await supabase
        .from("triage_requests")
        .update({ partner_id: partner.id })
        .eq("id", triage.id);
      await supabase.from("referrals").insert({
        homeowner_id: user.id,
        realtor_id: realtorId,
        partner_id: partner.id,
        category: issue.category,
        triage_id: triage.id,
      });
    }
    setMatch(partner);
    setStep("result");
    setBusy(false);
  };

  const reset = () => {
    setStep("pick");
    setIssueKey(null);
    setDescription("");
    setMatch(null);
  };

  const sevTint =
    issue?.severity === "urgent"
      ? "bg-destructive/15 text-destructive"
      : issue?.severity === "soon"
      ? "bg-warning/15 text-warning"
      : "bg-muted text-muted-foreground";

  return (
    <>
      <AppHeader title="Something broke" subtitle="We'll triage and route you" />
      <main className="container-app py-6">
        {step === "pick" && (
          <>
            <div className="mb-5 flex items-start gap-3 rounded-2xl border border-destructive/30 bg-destructive/5 p-4">
              <AlertTriangle className="mt-0.5 h-5 w-5 text-destructive" />
              <div className="text-sm">
                <div className="font-semibold">Pick the issue closest to what's happening</div>
                <div className="text-muted-foreground">We'll show DIY steps or route to a pro.</div>
              </div>
            </div>
            <div className="space-y-2">
              {TRIAGE_ISSUES.map((i) => {
                const catLabel = PARTNER_CATEGORIES.find((c) => c.key === i.category)?.label ?? i.category;
                return (
                  <button
                    key={i.key}
                    onClick={() => {
                      setIssueKey(i.key);
                      setStep("detail");
                    }}
                    className="flex w-full items-center justify-between rounded-2xl border border-border bg-card p-4 text-left transition-colors hover:bg-accent"
                  >
                    <div>
                      <div className="font-medium">{i.label}</div>
                      <div className="text-[11px] text-muted-foreground">{catLabel}</div>
                    </div>
                    <span
                      className={`rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase ${
                        i.severity === "urgent"
                          ? "bg-destructive/15 text-destructive"
                          : i.severity === "soon"
                          ? "bg-warning/15 text-warning"
                          : "bg-muted text-muted-foreground"
                      }`}
                    >
                      {i.severity.replace("_", " ")}
                    </span>
                  </button>
                );
              })}
            </div>
          </>
        )}

        {step === "detail" && issue && (
          <>
            <button
              onClick={() => setStep("pick")}
              className="mb-4 inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground"
            >
              <ArrowLeft className="h-4 w-4" /> Pick a different issue
            </button>
            <div className="rounded-2xl border border-border bg-card p-5 shadow-soft">
              <div className={`inline-flex rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase ${sevTint}`}>
                {issue.severity.replace("_", " ")}
              </div>
              <h2 className="mt-2 font-display text-lg font-semibold">{issue.label}</h2>
              <div className="mt-4">
                <div className="mb-1 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                  Quick first steps
                </div>
                <ul className="space-y-1.5 text-sm">
                  {issue.severity === "urgent" && (
                    <li className="flex gap-2">
                      <Sparkles className="mt-0.5 h-4 w-4 shrink-0 text-warning" />
                      <span>If active leak or gas smell: shut off the main supply now. See Systems reference.</span>
                    </li>
                  )}
                  <li className="flex gap-2">
                    <Sparkles className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
                    <span>Take a photo of the issue area for the pro.</span>
                  </li>
                  <li className="flex gap-2">
                    <Sparkles className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
                    <span>Note when it started and any unusual sounds, smells, or stains.</span>
                  </li>
                </ul>
              </div>
              <div className="mt-5 space-y-2">
                <label className="text-sm font-medium">Add details (optional)</label>
                <Textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value.slice(0, 1000))}
                  placeholder="e.g. Water dripping from ceiling near master bath, started yesterday."
                  rows={4}
                />
              </div>
              <Button onClick={dispatch} disabled={busy} className="mt-5 w-full" size="lg">
                {busy ? "Submitting…" : "Find me a pro"}
              </Button>
            </div>
          </>
        )}

        {step === "result" && issue && (
          <div className="space-y-4">
            <div className="rounded-2xl border border-border bg-card-gradient p-5 shadow-soft">
              <div className="text-xs text-muted-foreground">Your issue</div>
              <div className="font-display text-lg font-semibold">{issue.label}</div>
            </div>
            {match ? (
              <div className="rounded-2xl bg-hero p-1 shadow-glow">
                <div className="rounded-[18px] bg-card p-5">
                  <div className="text-xs uppercase tracking-widest text-primary">Recommended pro</div>
                  <div className="mt-1 font-display text-xl font-semibold">{match.name}</div>
                  {match.response_time && (
                    <div className="text-sm text-muted-foreground">Typical response: {match.response_time}</div>
                  )}
                  {match.phone ? (
                    <Button asChild className="mt-4 w-full" size="lg">
                      <a href={`tel:${match.phone}`}>
                        <Phone className="mr-2 h-4 w-4" /> Call {match.phone}
                      </a>
                    </Button>
                  ) : (
                    <Button disabled className="mt-4 w-full">No phone on file</Button>
                  )}
                  <p className="mt-3 text-[11px] text-muted-foreground">
                    Your realtor has been notified of this referral.
                  </p>
                </div>
              </div>
            ) : (
              <div className="rounded-2xl border border-border bg-card p-5 text-sm text-muted-foreground">
                Your realtor hasn't added a {issue.category} partner yet. Try calling a trusted local
                pro and log the work in your maintenance history.
              </div>
            )}
            <Button variant="outline" onClick={reset} className="w-full">Triage another issue</Button>
          </div>
        )}
      </main>
    </>
  );
}
