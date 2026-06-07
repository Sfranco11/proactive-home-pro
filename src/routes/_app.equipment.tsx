import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { Plus, Wrench, CheckCircle2, Trash2, ChevronRight } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth-context";
import { AppHeader } from "@/components/AppHeader";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { EQUIPMENT_PRESETS, getPreset, computeHealth, TONE_CLASS } from "@/lib/equipment";
import { upsertEquipment, deleteEquipment, markServiced } from "@/lib/equipment.functions";

export const Route = createFileRoute("/_app/equipment")({
  component: EquipmentPage,
});

interface EquipmentRow {
  id: string;
  type: string;
  category: string;
  name: string;
  brand: string | null;
  model: string | null;
  install_date: string | null;
  expected_lifespan_months: number | null;
  service_interval_months: number | null;
  last_serviced_at: string | null;
  notes: string | null;
  partner_category: string | null;
}

function EquipmentPage() {
  const { user } = useAuth();
  const [rows, setRows] = useState<EquipmentRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<EquipmentRow | null>(null);

  const upsertFn = useServerFn(upsertEquipment);
  const deleteFn = useServerFn(deleteEquipment);
  const servicedFn = useServerFn(markServiced);

  async function reload() {
    if (!user) return;
    const { data } = await supabase
      .from("home_equipment" as any)
      .select("*")
      .eq("owner_id", user.id)
      .order("created_at", { ascending: false });
    setRows((data as any) ?? []);
    setLoading(false);
  }

  useEffect(() => { reload(); /* eslint-disable-next-line */ }, [user]);

  const grouped = {
    system: rows.filter((r) => r.category === "system"),
    appliance: rows.filter((r) => r.category === "appliance"),
    consumable: rows.filter((r) => r.category === "consumable"),
    custom: rows.filter((r) => r.category === "custom"),
  };

  return (
    <>
      <AppHeader title="My equipment" subtitle="Track age · get reminders" />
      <main className="container-app py-6 pb-24 space-y-6">
        <div className="rounded-2xl bg-card-gradient p-4 shadow-soft">
          <p className="text-sm text-muted-foreground">
            Like the filter indicator on your Dyson — track every major item in your home, see life remaining at a glance, and get notified when it's time to service or replace.
          </p>
        </div>

        <div className="flex justify-between items-center">
          <h2 className="font-display text-lg font-semibold">{rows.length} items tracked</h2>
          <Dialog open={dialogOpen} onOpenChange={(o) => { setDialogOpen(o); if (!o) setEditing(null); }}>
            <DialogTrigger asChild>
              <Button size="sm" onClick={() => setEditing(null)}>
                <Plus className="h-4 w-4 mr-1" /> Add
              </Button>
            </DialogTrigger>
            <EquipmentDialog
              editing={editing}
              onSave={async (payload) => {
                try {
                  await upsertFn({ data: payload });
                  toast.success(editing ? "Updated" : "Added");
                  setDialogOpen(false);
                  setEditing(null);
                  reload();
                } catch (e: any) { toast.error(e.message ?? "Failed"); }
              }}
            />
          </Dialog>
        </div>

        {loading ? (
          <p className="text-sm text-muted-foreground">Loading…</p>
        ) : rows.length === 0 ? (
          <EmptyState onAdd={() => setDialogOpen(true)} />
        ) : (
          (["system", "appliance", "consumable", "custom"] as const).map((cat) =>
            grouped[cat].length === 0 ? null : (
              <section key={cat}>
                <div className="mb-2 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                  {cat === "system" ? "Core systems" : cat === "appliance" ? "Appliances" : cat === "consumable" ? "Filters & detectors" : "Custom"}
                </div>
                <div className="space-y-2">
                  {grouped[cat].map((eq) => (
                    <EquipmentCard
                      key={eq.id}
                      eq={eq}
                      onEdit={() => { setEditing(eq); setDialogOpen(true); }}
                      onDelete={async () => {
                        if (!confirm(`Delete ${eq.name}?`)) return;
                        await deleteFn({ data: { id: eq.id } });
                        toast.success("Deleted");
                        reload();
                      }}
                      onServiced={async () => {
                        await servicedFn({ data: { id: eq.id } });
                        toast.success("Marked as serviced today");
                        reload();
                      }}
                    />
                  ))}
                </div>
              </section>
            )
          )
        )}
      </main>
    </>
  );
}

function EmptyState({ onAdd }: { onAdd: () => void }) {
  return (
    <div className="rounded-2xl border border-dashed border-border bg-card p-8 text-center">
      <Wrench className="mx-auto h-10 w-10 text-muted-foreground" />
      <h3 className="mt-3 font-display font-semibold">No equipment yet</h3>
      <p className="mt-1 text-sm text-muted-foreground">Add your furnace, AC, water heater, or anything you want to keep an eye on.</p>
      <Button className="mt-4" onClick={onAdd}><Plus className="h-4 w-4 mr-1" /> Add first item</Button>
    </div>
  );
}

function EquipmentCard({ eq, onEdit, onDelete, onServiced }: {
  eq: EquipmentRow;
  onEdit: () => void;
  onDelete: () => void;
  onServiced: () => void;
}) {
  const preset = getPreset(eq.type);
  const Icon = preset?.icon ?? Wrench;
  const health = computeHealth(eq);
  const tone = TONE_CLASS[health.tone];
  const partnerCat = eq.partner_category ?? preset?.partnerCategory;

  return (
    <div className="rounded-2xl border border-border bg-card p-4 shadow-soft">
      <div className="flex items-start gap-3">
        <div className={`grid h-11 w-11 place-items-center rounded-xl ${tone.bg} ${tone.text}`}>
          <Icon className="h-5 w-5" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2">
            <div className="min-w-0">
              <div className="font-display font-semibold truncate">{eq.name}</div>
              <div className="text-[11px] text-muted-foreground truncate">
                {[eq.brand, eq.model].filter(Boolean).join(" · ") || (eq.install_date ? `Installed ${eq.install_date}` : "No install date set")}
              </div>
            </div>
            <span className={`shrink-0 rounded-full px-2 py-0.5 text-[10px] font-semibold ${tone.bg} ${tone.text}`}>{health.label}</span>
          </div>

          {/* Dyson-style life bar */}
          <div className="mt-3 h-2 rounded-full bg-muted overflow-hidden">
            <div className={`h-full ${tone.bar} transition-all`} style={{ width: `${health.pctRemaining}%` }} />
          </div>
          <div className="mt-1 flex justify-between text-[10px] text-muted-foreground">
            <span>{Math.round(health.pctRemaining)}% life remaining</span>
            <span>{health.action}</span>
          </div>

          <div className="mt-3 flex flex-wrap gap-2">
            {(health.tone === "due" || health.tone === "overdue" || health.tone === "warn") && partnerCat && (
              <Button asChild size="sm" variant="default">
                <Link to="/pros" search={{ category: partnerCat } as any}>Book service <ChevronRight className="ml-0.5 h-3 w-3" /></Link>
              </Button>
            )}
            {eq.service_interval_months && (
              <Button size="sm" variant="outline" onClick={onServiced}>
                <CheckCircle2 className="h-3.5 w-3.5 mr-1" /> Mark serviced
              </Button>
            )}
            <Button size="sm" variant="ghost" onClick={onEdit}>Edit</Button>
            <Button size="sm" variant="ghost" className="text-destructive hover:text-destructive" onClick={onDelete}>
              <Trash2 className="h-3.5 w-3.5" />
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}

function EquipmentDialog({ editing, onSave }: {
  editing: EquipmentRow | null;
  onSave: (payload: any) => Promise<void>;
}) {
  const [presetType, setPresetType] = useState<string>(editing?.type ?? "hvac_furnace");
  const [name, setName] = useState(editing?.name ?? "");
  const [brand, setBrand] = useState(editing?.brand ?? "");
  const [model, setModel] = useState(editing?.model ?? "");
  const [installDate, setInstallDate] = useState(editing?.install_date ?? "");
  const [lifespan, setLifespan] = useState<string>(String(editing?.expected_lifespan_months ?? ""));
  const [interval, setInterval] = useState<string>(String(editing?.service_interval_months ?? ""));
  const [lastServiced, setLastServiced] = useState(editing?.last_serviced_at ?? "");
  const [notes, setNotes] = useState(editing?.notes ?? "");

  useEffect(() => {
    if (editing) return;
    const p = getPreset(presetType);
    if (!p) return;
    if (!name) setName(p.name);
    setLifespan(String(p.expectedLifespanMonths));
    setInterval(p.serviceIntervalMonths ? String(p.serviceIntervalMonths) : "");
    // eslint-disable-next-line
  }, [presetType]);

  const preset = getPreset(presetType);

  return (
    <DialogContent className="max-h-[90vh] overflow-y-auto">
      <DialogHeader>
        <DialogTitle>{editing ? "Edit equipment" : "Add equipment"}</DialogTitle>
      </DialogHeader>

      <div className="space-y-3">
        {!editing && (
          <div>
            <Label>Type</Label>
            <Select value={presetType} onValueChange={setPresetType}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {EQUIPMENT_PRESETS.map((p) => (
                  <SelectItem key={p.type} value={p.type}>{p.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        )}

        <div>
          <Label>Name</Label>
          <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Basement furnace" />
        </div>

        <div className="grid grid-cols-2 gap-2">
          <div>
            <Label>Brand</Label>
            <Input value={brand ?? ""} onChange={(e) => setBrand(e.target.value)} placeholder="Lennox" />
          </div>
          <div>
            <Label>Model</Label>
            <Input value={model ?? ""} onChange={(e) => setModel(e.target.value)} placeholder="EL296V" />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-2">
          <div>
            <Label>Install date</Label>
            <Input type="date" value={installDate ?? ""} onChange={(e) => setInstallDate(e.target.value)} />
          </div>
          <div>
            <Label>Expected life (months)</Label>
            <Input type="number" value={lifespan} onChange={(e) => setLifespan(e.target.value)} />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-2">
          <div>
            <Label>Service every (months)</Label>
            <Input type="number" value={interval} onChange={(e) => setInterval(e.target.value)} placeholder="optional" />
          </div>
          <div>
            <Label>Last serviced</Label>
            <Input type="date" value={lastServiced ?? ""} onChange={(e) => setLastServiced(e.target.value)} />
          </div>
        </div>

        <div>
          <Label>Notes</Label>
          <Textarea value={notes ?? ""} onChange={(e) => setNotes(e.target.value)} rows={2} placeholder="Serial #, warranty, quirks…" />
        </div>
      </div>

      <DialogFooter>
        <Button
          onClick={() => onSave({
            id: editing?.id,
            type: presetType,
            category: preset?.category ?? "custom",
            name: name.trim() || preset?.name || "Equipment",
            brand: brand || null,
            model: model || null,
            install_date: installDate || null,
            expected_lifespan_months: lifespan ? Number(lifespan) : null,
            service_interval_months: interval ? Number(interval) : null,
            last_serviced_at: lastServiced || null,
            notes: notes || null,
            partner_category: preset?.partnerCategory ?? null,
          })}
        >
          {editing ? "Save changes" : "Add equipment"}
        </Button>
      </DialogFooter>
    </DialogContent>
  );
}
