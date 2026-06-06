import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { AlertTriangle, ArrowLeft, Sparkles, Camera } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth-context";
import { AppHeader } from "@/components/AppHeader";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { TRIAGE_ISSUES, PARTNER_CATEGORIES } from "@/lib/home-systems";

export const Route = createFileRoute("/_app/triage")({
  component: TriagePage,
});

// Only true emergencies surface safety guidance.
const SAFETY_CATEGORIES = new Set(["plumbers", "electricians", "hvac", "gas"]);
const SAFETY_TIPS: Record<string, string> = {
  plumbers: "Active leak? Shut off the main water supply. Move valuables off the floor.",
  electricians: "Smell burning or seeing sparks? Switch off the breaker. Don't touch wet electronics.",
  hvac: "Smell gas? Leave the home now and call your utility's emergency line.",
  gas: "Smell gas? Leave the home now and call your utility's emergency line.",
};

function TriagePage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [step, setStep] = useState<"pick" | "detail">("pick");
  const [issueKey, setIssueKey] = useState<string | null>(null);
  const [description, setDescription] = useState("");
  const [photo, setPhoto] = useState<File | null>(null);
  const [homeId, setHomeId] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!user) return;
    supabase.from("homes").select("id").eq("owner_id", user.id).maybeSingle()
      .then(({ data }) => setHomeId(data?.id ?? null));
  }, [user]);

  const issue = TRIAGE_ISSUES.find((i) => i.key === issueKey);

  const bookAPro = async () => {
    if (!user || !homeId || !issue) return;
    setBusy(true);
    let photoUrl: string | null = null;
    if (photo) {
      const path = `${user.id}/triage/${Date.now()}-${photo.name.replace(/[^a-zA-Z0-9._-]/g, "_")}`;
      const { error } = await supabase.storage.from("booking-photos").upload(path, photo);
      if (!error) photoUrl = supabase.storage.from("booking-photos").getPublicUrl(path).data.publicUrl;
    }
    await supabase.from("triage_requests").insert({
      owner_id: user.id,
      home_id: homeId,
      category: issue.category,
      description,
      severity: issue.severity,
      photo_url: photoUrl,
    });
    setBusy(false);
    navigate({ to: "/pros", search: { category: issue.category } as any });
  };

  const sevTint =
    issue?.severity === "urgent"
      ? "bg-destructive/15 text-destructive"
      : issue?.severity === "soon"
      ? "bg-warning/15 text-warning"
      : "bg-muted text-muted-foreground";

  const showSafety = issue && issue.severity === "urgent" && SAFETY_CATEGORIES.has(issue.category);

  return (
    <>
      <AppHeader title="What's going on?" subtitle="We'll match you with the right pro" />
      <main className="container-app py-6">
        {step === "pick" && (
          <>
            <div className="mb-5 rounded-2xl border border-border bg-card p-4 text-sm">
              <div className="font-semibold">Pick the issue closest to what's happening</div>
              <div className="text-muted-foreground">We'll route you to a vetted professional.</div>
            </div>
            <div className="space-y-2">
              {TRIAGE_ISSUES.map((i) => {
                const catLabel = PARTNER_CATEGORIES.find((c) => c.key === i.category)?.label ?? i.category;
                return (
                  <button
                    key={i.key}
                    onClick={() => { setIssueKey(i.key); setStep("detail"); }}
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

              {showSafety && (
                <div className="mt-4 flex gap-2 rounded-xl border border-destructive/30 bg-destructive/5 p-3 text-sm text-destructive">
                  <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
                  <div>
                    <div className="font-semibold">Safety first</div>
                    <p>{SAFETY_TIPS[issue.category] ?? "If anyone is in danger, call 911."}</p>
                  </div>
                </div>
              )}

              <div className="mt-5 space-y-2">
                <label className="text-sm font-medium">Tell us what's happening (optional)</label>
                <Textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value.slice(0, 1000))}
                  placeholder="e.g. Water dripping from ceiling near master bath since last night."
                  rows={3}
                />
              </div>

              <div className="mt-3 space-y-2">
                <label className="text-sm font-medium">Add a photo <span className="text-muted-foreground">(optional, helps the pro)</span></label>
                <label className="flex cursor-pointer items-center justify-center gap-2 rounded-xl border border-dashed border-border bg-background p-4 text-sm text-muted-foreground hover:bg-accent">
                  <Camera className="h-4 w-4" />
                  {photo ? photo.name : "Tap to attach a photo"}
                  <input
                    type="file"
                    accept="image/*"
                    capture="environment"
                    hidden
                    onChange={(e) => setPhoto(e.target.files?.[0] ?? null)}
                  />
                </label>
              </div>

              <Button onClick={bookAPro} disabled={busy} className="mt-5 w-full" size="lg">
                <Sparkles className="mr-2 h-4 w-4" />
                {busy ? "Routing…" : "Book a professional"}
              </Button>
              <p className="mt-2 text-center text-[11px] text-muted-foreground">
                You'll see vetted, top-rated pros for this issue next.
              </p>
            </div>
          </>
        )}
      </main>
    </>
  );
}
