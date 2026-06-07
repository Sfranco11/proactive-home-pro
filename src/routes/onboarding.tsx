import { createFileRoute, Navigate, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Home, ArrowRight } from "lucide-react";
import { z } from "zod";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth-context";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";

export const Route = createFileRoute("/onboarding")({
  validateSearch: (s: Record<string, unknown>) => ({
    code: typeof s.code === "string" ? s.code : undefined,
  }),
  component: Onboarding,
});

const schema = z.object({
  home_type: z.string().min(1),
  year_built: z.coerce.number().int().min(1800).max(new Date().getFullYear()).optional().or(z.literal("")),
  climate_zone: z.string().max(50).optional(),
  address: z.string().max(200).optional(),
  hvac_type: z.string().max(50).optional(),
  foundation_type: z.string().max(50).optional(),
  referral_code: z.string().trim().max(40).optional(),
});

function Onboarding() {
  const { session, loading, user } = useAuth();
  const { code } = Route.useSearch();
  const nav = useNavigate();
  const [busy, setBusy] = useState(false);
  const [form, setForm] = useState({
    home_type: "single_family",
    year_built: "" as string | number,
    climate_zone: "",
    address: "",
    hvac_type: "central_ac",
    foundation_type: "slab",
    referral_code: code ?? "",
  });
  const [hasHome, setHasHome] = useState<boolean | null>(null);

  useEffect(() => {
    if (!user) return;
    supabase
      .from("homes")
      .select("id")
      .eq("owner_id", user.id)
      .limit(1)
      .then(({ data }) => setHasHome(!!data && data.length > 0));
  }, [user]);

  if (loading) return <div className="grid min-h-screen place-items-center text-muted-foreground">Loading…</div>;
  if (!session) return <Navigate to="/auth" search={code ? { code } as any : undefined} />;
  if (hasHome) return <Navigate to="/home" />;

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    const parsed = schema.safeParse(form);
    if (!parsed.success) {
      toast.error(parsed.error.issues[0].message);
      return;
    }
    setBusy(true);

    let realtor_id: string | null = null;
    if (parsed.data.referral_code) {
      const { data: rid } = await (supabase as any)
        .rpc("resolve_realtor_by_code", { _code: parsed.data.referral_code.trim() });
      if (rid) realtor_id = rid as string;
      else toast.warning("Referral code not found — saving without realtor link.");
    }

    const { error } = await supabase.from("homes").insert({
      owner_id: user!.id,
      realtor_id,
      home_type: parsed.data.home_type,
      year_built: parsed.data.year_built === "" ? null : Number(parsed.data.year_built),
      climate_zone: parsed.data.climate_zone || null,
      address: parsed.data.address || null,
      hvac_type: parsed.data.hvac_type || null,
      foundation_type: parsed.data.foundation_type || null,
    });
    setBusy(false);
    if (error) {
      toast.error(error.message);
      return;
    }
    toast.success("Home profile saved");
    nav({ to: "/home" });
  };

  return (
    <div className="min-h-screen bg-background">
      <main className="container-app py-10">
        <div className="mb-6 flex items-center gap-3">
          <div className="grid h-12 w-12 place-items-center rounded-2xl bg-primary text-primary-foreground shadow-glow">
            <Home className="h-6 w-6" />
          </div>
          <div>
            <h1 className="font-display text-2xl font-semibold">Tell us about your home</h1>
            <p className="text-sm text-muted-foreground">We'll personalize your maintenance plan.</p>
          </div>
        </div>

        <form onSubmit={submit} className="space-y-4">
          <Field label="Home type">
            <Select value={form.home_type} onValueChange={(v) => setForm({ ...form, home_type: v })}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="single_family">Single-family</SelectItem>
                <SelectItem value="townhouse">Townhouse</SelectItem>
                <SelectItem value="condo">Condo</SelectItem>
                <SelectItem value="multi_family">Multi-family</SelectItem>
                <SelectItem value="mobile">Mobile / manufactured</SelectItem>
              </SelectContent>
            </Select>
          </Field>

          <div className="grid grid-cols-2 gap-3">
            <Field label="Year built">
              <Input inputMode="numeric" value={form.year_built} onChange={(e) => setForm({ ...form, year_built: e.target.value })} placeholder="1998" />
            </Field>
            <Field label="Climate zone">
              <Input value={form.climate_zone} onChange={(e) => setForm({ ...form, climate_zone: e.target.value })} placeholder="e.g. Hot-humid" />
            </Field>
          </div>

          <Field label="Address (optional)">
            <Input value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} placeholder="123 Maple St" />
          </Field>

          <div className="grid grid-cols-2 gap-3">
            <Field label="HVAC">
              <Select value={form.hvac_type} onValueChange={(v) => setForm({ ...form, hvac_type: v })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="central_ac">Central AC + furnace</SelectItem>
                  <SelectItem value="heat_pump">Heat pump</SelectItem>
                  <SelectItem value="mini_split">Mini-split</SelectItem>
                  <SelectItem value="radiator">Boiler / radiator</SelectItem>
                  <SelectItem value="none">None / window units</SelectItem>
                </SelectContent>
              </Select>
            </Field>
            <Field label="Foundation">
              <Select value={form.foundation_type} onValueChange={(v) => setForm({ ...form, foundation_type: v })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="slab">Slab</SelectItem>
                  <SelectItem value="crawlspace">Crawlspace</SelectItem>
                  <SelectItem value="basement">Basement</SelectItem>
                  <SelectItem value="pier_beam">Pier & beam</SelectItem>
                </SelectContent>
              </Select>
            </Field>
          </div>

          <Field label="Realtor referral code (optional)">
            <Input
              value={form.referral_code}
              onChange={(e) => setForm({ ...form, referral_code: e.target.value.toUpperCase() })}
              placeholder="ABC123"
              className="font-mono"
            />
          </Field>

          <Button type="submit" disabled={busy} size="lg" className="w-full">
            {busy ? "Saving…" : "Finish setup"} <ArrowRight className="ml-2 h-4 w-4" />
          </Button>
        </form>
      </main>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="space-y-2">
      <Label>{label}</Label>
      {children}
    </div>
  );
}
