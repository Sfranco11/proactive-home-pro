import { createFileRoute, Navigate } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { Copy, Plus, Trash2, Pencil, Users, Tag, Building2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth-context";
import { AppHeader } from "@/components/AppHeader";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { PARTNER_CATEGORIES } from "@/lib/home-systems";
import { toast } from "sonner";
import { z } from "zod";

export const Route = createFileRoute("/_app/realtor")({
  component: RealtorPage,
});

interface RealtorRow {
  user_id: string;
  company_name: string;
  brand_color: string;
  logo_url: string | null;
  referral_code: string;
}
interface Partner {
  id: string;
  name: string;
  category: string;
  phone: string | null;
  email: string | null;
  service_area: string | null;
  response_time: string | null;
  hours: string | null;
  discount_code: string | null;
  notes: string | null;
}
interface Referral {
  id: string;
  category: string;
  fee_status: string;
  fee_amount: number | null;
  created_at: string;
  partner: { name: string } | null;
}

function randomCode() {
  const c = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  return Array.from({ length: 6 }, () => c[Math.floor(Math.random() * c.length)]).join("");
}

function RealtorPage() {
  const { session, profile, user, loading, refreshProfile } = useAuth();
  const [realtor, setRealtor] = useState<RealtorRow | null>(null);
  const [partners, setPartners] = useState<Partner[]>([]);
  const [referrals, setReferrals] = useState<Referral[]>([]);
  const [clientCount, setClientCount] = useState(0);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    if (!user || profile?.role !== "realtor") return;
    (async () => {
      let { data: r } = await supabase
        .from("realtors")
        .select("*")
        .eq("user_id", user.id)
        .maybeSingle();
      if (!r) {
        // auto-create realtor row
        const ins = await supabase
          .from("realtors")
          .insert({
            user_id: user.id,
            company_name: profile?.full_name ? `${profile.full_name} Realty` : "My Realty",
            referral_code: randomCode(),
          })
          .select("*")
          .single();
        r = ins.data;
      }
      setRealtor(r as RealtorRow);

      const [{ data: ps }, { data: refs }, { count }] = await Promise.all([
        supabase.from("partners").select("*").eq("realtor_id", user.id).order("category"),
        supabase
          .from("referrals")
          .select("id, category, fee_status, fee_amount, created_at, partner:partners(name)")
          .eq("realtor_id", user.id)
          .order("created_at", { ascending: false })
          .limit(50),
        supabase.from("homes").select("id", { count: "exact", head: true }).eq("realtor_id", user.id),
      ]);
      setPartners((ps as Partner[]) ?? []);
      setReferrals((refs as any) ?? []);
      setClientCount(count ?? 0);
      setLoaded(true);
    })();
  }, [user, profile?.role]);

  if (loading) return <div className="grid min-h-screen place-items-center text-muted-foreground">Loading…</div>;
  if (!session) return <Navigate to="/auth" search={{ mode: "realtor" } as any} />;
  if (profile && profile.role !== "realtor") return <Navigate to="/home" />;

  const totals = useMemo(() => {
    const total = referrals.length;
    const paid = referrals.filter((r) => r.fee_status === "paid").reduce((s, r) => s + Number(r.fee_amount ?? 0), 0);
    const pending = referrals.filter((r) => r.fee_status === "pending").length;
    return { total, paid, pending };
  }, [referrals]);

  return (
    <>
      <AppHeader title={realtor?.company_name ?? "Realtor"} subtitle="Dashboard" />
      <main className="container-app py-6">
        {!loaded ? (
          <div className="text-sm text-muted-foreground">Loading…</div>
        ) : (
          <Tabs defaultValue="overview">
            <TabsList className="grid w-full grid-cols-4 text-xs">
              <TabsTrigger value="overview">Overview</TabsTrigger>
              <TabsTrigger value="partners">Partners</TabsTrigger>
              <TabsTrigger value="referrals">Referrals</TabsTrigger>
              <TabsTrigger value="brand">Brand</TabsTrigger>
            </TabsList>

            <TabsContent value="overview" className="mt-5 space-y-4">
              {/* Hero KPI */}
              <div className="overflow-hidden rounded-3xl bg-hero p-5 text-primary-foreground shadow-glow">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <div className="text-[10px] font-semibold uppercase tracking-widest text-primary-foreground/70">
                      Fees paid · all time
                    </div>
                    <div className="mt-1 font-display text-4xl font-bold tracking-tight">
                      ${totals.paid.toFixed(0)}
                    </div>
                    <div className="mt-1 text-xs text-primary-foreground/75">
                      {totals.total} referrals · {totals.pending} pending payout
                    </div>
                  </div>
                  <div className="rounded-2xl bg-gold/15 px-3 py-1.5 text-xs font-semibold text-gold">
                    {clientCount} {clientCount === 1 ? "client" : "clients"}
                  </div>
                </div>
                <div className="mt-4 rounded-2xl bg-white/10 p-3 backdrop-blur">
                  <div className="text-[10px] font-semibold uppercase tracking-widest text-primary-foreground/70">
                    Your invite code
                  </div>
                  <div className="mt-1 flex items-center gap-2">
                    <span className="font-display text-2xl font-bold tracking-[0.25em]">
                      {realtor?.referral_code}
                    </span>
                    <Button
                      size="sm"
                      variant="ghost"
                      className="text-primary-foreground hover:bg-white/10 hover:text-primary-foreground"
                      onClick={() => {
                        navigator.clipboard.writeText(realtor?.referral_code ?? "");
                        toast.success("Code copied");
                      }}
                    >
                      <Copy className="mr-1 h-3.5 w-3.5" /> Copy
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      className="text-primary-foreground hover:bg-white/10 hover:text-primary-foreground"
                      onClick={() => {
                        const url = `${window.location.origin}/r/${realtor?.referral_code}`;
                        navigator.clipboard.writeText(url);
                        toast.success("Invite link copied");
                      }}
                    >
                      Copy link
                    </Button>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <Stat icon={Users} label="Clients" value={clientCount} />
                <Stat icon={Tag} label="Referrals" value={totals.total} />
                <Stat icon={Building2} label="Partners" value={partners.length} />
              </div>


              <div className="rounded-2xl border border-border bg-card p-5">
                <h3 className="font-display font-semibold">Recent referrals</h3>
                <div className="mt-3 space-y-2">
                  {referrals.slice(0, 5).map((r) => (
                    <div key={r.id} className="flex items-center justify-between rounded-xl bg-muted/40 p-3 text-sm">
                      <div>
                        <div className="font-medium">{r.partner?.name ?? "(deleted)"}</div>
                        <div className="text-[11px] text-muted-foreground">
                          {r.category} · {new Date(r.created_at).toLocaleDateString()}
                        </div>
                      </div>
                      <span
                        className={`rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase ${
                          r.fee_status === "paid"
                            ? "bg-success/15 text-success"
                            : r.fee_status === "pending"
                            ? "bg-warning/15 text-warning"
                            : "bg-muted text-muted-foreground"
                        }`}
                      >
                        {r.fee_status}
                      </span>
                    </div>
                  ))}
                  {referrals.length === 0 && (
                    <p className="text-sm text-muted-foreground">No referrals yet — share your code with clients.</p>
                  )}
                </div>
              </div>
            </TabsContent>

            <TabsContent value="partners" className="mt-5">
              <PartnersAdmin
                realtorId={user!.id}
                partners={partners}
                onChange={async () => {
                  const { data } = await supabase.from("partners").select("*").eq("realtor_id", user!.id).order("category");
                  setPartners((data as Partner[]) ?? []);
                }}
              />
            </TabsContent>

            <TabsContent value="referrals" className="mt-5">
              <ReferralsAdmin
                referrals={referrals}
                onUpdate={async (id, patch) => {
                  await supabase.from("referrals").update(patch as any).eq("id", id);
                  const { data: refs } = await supabase
                    .from("referrals")
                    .select("id, category, fee_status, fee_amount, created_at, partner:partners(name)")
                    .eq("realtor_id", user!.id)
                    .order("created_at", { ascending: false })
                    .limit(50);
                  setReferrals((refs as any) ?? []);
                }}
              />
            </TabsContent>

            <TabsContent value="brand" className="mt-5">
              {realtor && (
                <BrandAdmin
                  realtor={realtor}
                  onSaved={async () => {
                    const { data } = await supabase.from("realtors").select("*").eq("user_id", user!.id).maybeSingle();
                    setRealtor(data as RealtorRow);
                    await refreshProfile();
                  }}
                />
              )}
            </TabsContent>
          </Tabs>
        )}
      </main>
    </>
  );
}

function Stat({ icon: Icon, label, value }: { icon: typeof Users; label: string; value: number | string }) {
  return (
    <div className="rounded-2xl border border-border bg-card p-4">
      <Icon className="h-4 w-4 text-primary" />
      <div className="mt-2 font-display text-xl font-semibold">{value}</div>
      <div className="text-[11px] text-muted-foreground">{label}</div>
    </div>
  );
}

const partnerSchema = z.object({
  name: z.string().trim().min(1).max(120),
  category: z.string().min(1),
  phone: z.string().trim().max(40).optional().or(z.literal("")),
  email: z.string().trim().email().max(255).optional().or(z.literal("")),
  service_area: z.string().max(120).optional().or(z.literal("")),
  response_time: z.string().max(60).optional().or(z.literal("")),
  hours: z.string().max(60).optional().or(z.literal("")),
  discount_code: z.string().max(40).optional().or(z.literal("")),
  notes: z.string().max(500).optional().or(z.literal("")),
});

function PartnersAdmin({
  realtorId,
  partners,
  onChange,
}: {
  realtorId: string;
  partners: Partner[];
  onChange: () => Promise<void>;
}) {
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Partner | null>(null);
  const empty: Partner = {
    id: "",
    name: "",
    category: "plumbing",
    phone: "",
    email: "",
    service_area: "",
    response_time: "",
    hours: "",
    discount_code: "",
    notes: "",
  };
  const [form, setForm] = useState<Partner>(empty);

  const openNew = () => {
    setEditing(null);
    setForm(empty);
    setOpen(true);
  };
  const openEdit = (p: Partner) => {
    setEditing(p);
    setForm({ ...p });
    setOpen(true);
  };

  const save = async () => {
    const parsed = partnerSchema.safeParse({
      ...form,
      phone: form.phone ?? "",
      email: form.email ?? "",
      service_area: form.service_area ?? "",
      response_time: form.response_time ?? "",
      hours: form.hours ?? "",
      discount_code: form.discount_code ?? "",
      notes: form.notes ?? "",
    });
    if (!parsed.success) {
      toast.error(parsed.error.issues[0].message);
      return;
    }
    const payload = {
      realtor_id: realtorId,
      name: parsed.data.name,
      category: parsed.data.category,
      phone: parsed.data.phone || null,
      email: parsed.data.email || null,
      service_area: parsed.data.service_area || null,
      response_time: parsed.data.response_time || null,
      hours: parsed.data.hours || null,
      discount_code: parsed.data.discount_code || null,
      notes: parsed.data.notes || null,
    };
    const { error } = editing
      ? await supabase.from("partners").update(payload).eq("id", editing.id)
      : await supabase.from("partners").insert(payload);
    if (error) {
      toast.error(error.message);
      return;
    }
    toast.success(editing ? "Partner updated" : "Partner added");
    setOpen(false);
    await onChange();
  };

  const remove = async (id: string) => {
    if (!confirm("Remove this partner?")) return;
    const { error } = await supabase.from("partners").delete().eq("id", id);
    if (error) toast.error(error.message);
    else {
      toast.success("Removed");
      await onChange();
    }
  };

  return (
    <div>
      <div className="mb-3 flex items-center justify-between">
        <h3 className="font-display font-semibold">Your preferred partners</h3>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button size="sm" onClick={openNew}><Plus className="mr-1 h-4 w-4" /> Add</Button>
          </DialogTrigger>
          <DialogContent className="max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>{editing ? "Edit partner" : "New partner"}</DialogTitle>
            </DialogHeader>
            <div className="space-y-3">
              <Row label="Name">
                <Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
              </Row>
              <Row label="Category">
                <Select value={form.category} onValueChange={(v) => setForm({ ...form, category: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {PARTNER_CATEGORIES.map((c) => (
                      <SelectItem key={c.key} value={c.key}>{c.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </Row>
              <div className="grid grid-cols-2 gap-3">
                <Row label="Phone">
                  <Input value={form.phone ?? ""} onChange={(e) => setForm({ ...form, phone: e.target.value })} placeholder="555-555-1234" />
                </Row>
                <Row label="Email">
                  <Input type="email" value={form.email ?? ""} onChange={(e) => setForm({ ...form, email: e.target.value })} />
                </Row>
              </div>
              <Row label="Service area">
                <Input value={form.service_area ?? ""} onChange={(e) => setForm({ ...form, service_area: e.target.value })} placeholder="Greater Austin" />
              </Row>
              <div className="grid grid-cols-2 gap-3">
                <Row label="Response time">
                  <Input value={form.response_time ?? ""} onChange={(e) => setForm({ ...form, response_time: e.target.value })} placeholder="< 2 hrs" />
                </Row>
                <Row label="Hours">
                  <Input value={form.hours ?? ""} onChange={(e) => setForm({ ...form, hours: e.target.value })} placeholder="M-F 8-6" />
                </Row>
              </div>
              <Row label="Discount code (optional)">
                <Input value={form.discount_code ?? ""} onChange={(e) => setForm({ ...form, discount_code: e.target.value })} placeholder="HOMEPRO10" />
              </Row>
              <Row label="Notes">
                <Textarea rows={3} value={form.notes ?? ""} onChange={(e) => setForm({ ...form, notes: e.target.value })} />
              </Row>
            </div>
            <DialogFooter>
              <Button onClick={save}>Save</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
      <div className="space-y-2">
        {partners.length === 0 && (
          <div className="rounded-2xl border border-dashed border-border p-6 text-center text-sm text-muted-foreground">
            No partners yet. Add your plumber, HVAC, electrician, etc.
          </div>
        )}
        {partners.map((p) => (
          <div key={p.id} className="flex items-start justify-between gap-2 rounded-2xl border border-border bg-card p-4">
            <div>
              <div className="font-medium">{p.name}</div>
              <div className="text-[11px] text-muted-foreground">
                {PARTNER_CATEGORIES.find((c) => c.key === p.category)?.label ?? p.category}
                {p.phone && ` · ${p.phone}`}
              </div>
            </div>
            <div className="flex gap-1">
              <Button size="icon" variant="ghost" onClick={() => openEdit(p)}>
                <Pencil className="h-4 w-4" />
              </Button>
              <Button size="icon" variant="ghost" onClick={() => remove(p.id)}>
                <Trash2 className="h-4 w-4 text-destructive" />
              </Button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function ReferralsAdmin({
  referrals,
  onUpdate,
}: {
  referrals: Referral[];
  onUpdate: (id: string, patch: Partial<Referral>) => Promise<void>;
}) {
  return (
    <div className="space-y-2">
      {referrals.length === 0 && (
        <div className="rounded-2xl border border-dashed border-border p-6 text-center text-sm text-muted-foreground">
          No referrals yet.
        </div>
      )}
      {referrals.map((r) => (
        <div key={r.id} className="rounded-2xl border border-border bg-card p-4">
          <div className="flex items-start justify-between">
            <div>
              <div className="font-medium">{r.partner?.name ?? "(deleted)"}</div>
              <div className="text-[11px] text-muted-foreground">
                {r.category} · {new Date(r.created_at).toLocaleDateString()}
              </div>
            </div>
            <Select
              value={r.fee_status}
              onValueChange={(v) => onUpdate(r.id, { fee_status: v as any })}
            >
              <SelectTrigger className="h-8 w-28 text-xs"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="paid">Paid</SelectItem>
                <SelectItem value="waived">Waived</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="mt-3 flex items-center gap-2">
            <Label className="text-xs text-muted-foreground">Fee $</Label>
            <Input
              type="number"
              step="0.01"
              defaultValue={r.fee_amount ?? ""}
              onBlur={(e) =>
                onUpdate(r.id, { fee_amount: e.target.value ? Number(e.target.value) : null })
              }
              className="h-8 max-w-[120px]"
            />
          </div>
        </div>
      ))}
    </div>
  );
}

const brandSchema = z.object({
  company_name: z.string().trim().min(1).max(120),
  brand_color: z.string().regex(/^#[0-9a-fA-F]{6}$/, "Use a hex color like #064e3b"),
  logo_url: z.string().trim().url().max(500).optional().or(z.literal("")),
});

function BrandAdmin({ realtor, onSaved }: { realtor: RealtorRow; onSaved: () => Promise<void> }) {
  const [form, setForm] = useState({
    company_name: realtor.company_name,
    brand_color: realtor.brand_color,
    logo_url: realtor.logo_url ?? "",
  });
  const [busy, setBusy] = useState(false);

  const save = async () => {
    const parsed = brandSchema.safeParse(form);
    if (!parsed.success) {
      toast.error(parsed.error.issues[0].message);
      return;
    }
    setBusy(true);
    const { error } = await supabase
      .from("realtors")
      .update({
        company_name: parsed.data.company_name,
        brand_color: parsed.data.brand_color,
        logo_url: parsed.data.logo_url || null,
      })
      .eq("user_id", realtor.user_id);
    setBusy(false);
    if (error) {
      toast.error(error.message);
      return;
    }
    toast.success("Brand saved");
    await onSaved();
  };

  return (
    <div className="space-y-4">
      <div
        className="rounded-2xl p-5 text-white shadow-glow"
        style={{ background: `linear-gradient(160deg, ${form.brand_color}, #0a1f1a)` }}
      >
        <div className="flex items-center gap-3">
          {form.logo_url ? (
            <img src={form.logo_url} alt="" className="h-10 w-10 rounded-lg bg-white/15 object-contain p-1" />
          ) : (
            <div className="grid h-10 w-10 place-items-center rounded-lg bg-white/15">
              <Building2 className="h-5 w-5" />
            </div>
          )}
          <div>
            <div className="text-xs opacity-80">Live preview</div>
            <div className="font-display text-lg font-semibold">{form.company_name || "Your company"}</div>
          </div>
        </div>
      </div>
      <Row label="Company name">
        <Input value={form.company_name} onChange={(e) => setForm({ ...form, company_name: e.target.value })} />
      </Row>
      <Row label="Brand color">
        <div className="flex gap-2">
          <Input value={form.brand_color} onChange={(e) => setForm({ ...form, brand_color: e.target.value })} className="font-mono" />
          <input
            type="color"
            value={form.brand_color}
            onChange={(e) => setForm({ ...form, brand_color: e.target.value })}
            className="h-10 w-12 cursor-pointer rounded-md border border-border bg-background"
          />
        </div>
      </Row>
      <Row label="Logo URL (optional)">
        <Input value={form.logo_url} onChange={(e) => setForm({ ...form, logo_url: e.target.value })} placeholder="https://…" />
      </Row>
      <Button onClick={save} disabled={busy} className="w-full">{busy ? "Saving…" : "Save brand"}</Button>
    </div>
  );
}

function Row({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1.5">
      <Label className="text-xs">{label}</Label>
      {children}
    </div>
  );
}
