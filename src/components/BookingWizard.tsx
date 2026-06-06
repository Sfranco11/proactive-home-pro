import { useState } from "react";
import { useNavigate } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { CalendarDays, Clock, Repeat, Check, Sparkles, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { createBooking } from "@/lib/bookings.functions";
import { createAutopilotSchedule } from "@/lib/autopilot.functions";
import { AUTOPILOT_PRESETS } from "@/lib/autopilot";

type Mode = "one_time" | "autopilot" | "custom";

interface Props {
  providerId: string;
  providerName: string;
  category: string;
  onClose: () => void;
}

const TIME_SLOTS = [
  { v: "08:00", l: "8:00 AM" },
  { v: "10:00", l: "10:00 AM" },
  { v: "12:00", l: "12:00 PM" },
  { v: "14:00", l: "2:00 PM" },
  { v: "16:00", l: "4:00 PM" },
];

export function BookingWizard({ providerId, providerName, category, onClose }: Props) {
  const navigate = useNavigate();
  const bookFn = useServerFn(createBooking);
  const scheduleFn = useServerFn(createAutopilotSchedule);

  const preset = AUTOPILOT_PRESETS.find((p) => p.category === category);
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [mode, setMode] = useState<Mode>("one_time");
  const [date, setDate] = useState<string>(() => {
    const d = new Date();
    d.setDate(d.getDate() + 1);
    return d.toISOString().slice(0, 10);
  });
  const [time, setTime] = useState<string>("10:00");
  const [notes, setNotes] = useState("");
  const [customDays, setCustomDays] = useState(30);
  const [busy, setBusy] = useState(false);

  const submit = async () => {
    setBusy(true);
    try {
      const scheduled_at = new Date(`${date}T${time}:00`).toISOString();
      if (mode === "autopilot" && preset) {
        await scheduleFn({
          data: {
            provider_id: providerId,
            category,
            cadence: preset.cadence,
            notes: notes || undefined,
            first_run_at: scheduled_at,
          },
        });
      } else if (mode === "custom") {
        await scheduleFn({
          data: {
            provider_id: providerId,
            category,
            cadence: "monthly",
            interval_days: customDays,
            notes: notes || undefined,
            first_run_at: scheduled_at,
          },
        });
      }
      const { id } = await bookFn({
        data: {
          provider_id: providerId,
          category,
          service_type: mode === "one_time" ? "one_time" : "recurring",
          scheduled_at,
          notes: notes || undefined,
        },
      });
      toast.success(mode === "one_time" ? "Booking requested" : "AutoPilot scheduled");
      onClose();
      navigate({ to: "/bookings/$id", params: { id } });
    } catch (e: any) {
      toast.error(e?.message ?? "Could not book");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/50 sm:items-center">
      <div className="w-full max-w-md rounded-t-3xl bg-card p-5 shadow-xl sm:rounded-3xl">
        <div className="mb-4 flex items-center justify-between">
          <div>
            <h2 className="font-display text-lg font-semibold">Book {providerName}</h2>
            <p className="text-xs text-muted-foreground">Step {step} of 3</p>
          </div>
          <button onClick={onClose} className="text-xs text-muted-foreground hover:text-foreground">Close</button>
        </div>

        {step === 1 && (
          <div className="space-y-2">
            <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Service type</p>
            <ModeOption
              icon={Sparkles}
              title="One-time service"
              desc="Just this once"
              active={mode === "one_time"}
              onClick={() => setMode("one_time")}
            />
            {preset && (
              <ModeOption
                icon={Repeat}
                title={`AutoPilot · ${preset.label}`}
                desc={preset.blurb}
                badge="Recommended"
                active={mode === "autopilot"}
                onClick={() => setMode("autopilot")}
              />
            )}
            <ModeOption
              icon={CalendarDays}
              title="Custom recurring"
              desc="Pick your own interval"
              active={mode === "custom"}
              onClick={() => setMode("custom")}
            />
            {mode === "custom" && (
              <div className="rounded-xl bg-muted/40 p-3">
                <label className="text-xs font-medium">Every</label>
                <div className="mt-1 flex items-center gap-2">
                  <Input
                    type="number"
                    min={1}
                    max={365}
                    value={customDays}
                    onChange={(e) => setCustomDays(Math.max(1, Number(e.target.value) || 1))}
                    className="w-24"
                  />
                  <span className="text-sm text-muted-foreground">days</span>
                </div>
              </div>
            )}
            <Button className="mt-4 w-full" size="lg" onClick={() => setStep(2)}>Continue</Button>
          </div>
        )}

        {step === 2 && (
          <div className="space-y-4">
            <div>
              <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                <CalendarDays className="mr-1 inline h-3.5 w-3.5" /> Date
              </label>
              <Input
                type="date"
                value={date}
                min={new Date().toISOString().slice(0, 10)}
                onChange={(e) => setDate(e.target.value)}
                className="mt-1"
              />
            </div>
            <div>
              <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                <Clock className="mr-1 inline h-3.5 w-3.5" /> Time window
              </label>
              <div className="mt-2 grid grid-cols-3 gap-2">
                {TIME_SLOTS.map((s) => (
                  <button
                    key={s.v}
                    type="button"
                    onClick={() => setTime(s.v)}
                    className={`rounded-xl border px-2 py-2 text-xs font-medium transition ${
                      time === s.v ? "border-primary bg-primary text-primary-foreground" : "border-border bg-card hover:bg-accent"
                    }`}
                  >
                    {s.l}
                  </button>
                ))}
              </div>
            </div>
            <div>
              <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Notes for the pro (optional)</label>
              <Textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value.slice(0, 1000))}
                placeholder="Anything they should know? Access notes, pets, parking…"
                rows={3}
                className="mt-1"
              />
            </div>
            <div className="flex gap-2">
              <Button variant="outline" className="flex-1" onClick={() => setStep(1)}>Back</Button>
              <Button className="flex-1" onClick={() => setStep(3)}>Review</Button>
            </div>
          </div>
        )}

        {step === 3 && (
          <div className="space-y-3">
            <div className="rounded-xl border border-border bg-muted/30 p-4 space-y-2 text-sm">
              <Row label="Pro" value={providerName} />
              <Row label="When" value={`${new Date(`${date}T${time}:00`).toLocaleString()}`} />
              <Row
                label="Type"
                value={
                  mode === "one_time"
                    ? "One-time"
                    : mode === "autopilot"
                    ? `AutoPilot · ${preset?.blurb ?? "recurring"}`
                    : `Recurring every ${customDays} days`
                }
              />
              {notes && <Row label="Notes" value={notes} />}
            </div>
            <p className="text-[11px] text-muted-foreground">
              You'll be able to message the pro, track arrival, and review the work after.
            </p>
            <div className="flex gap-2">
              <Button variant="outline" className="flex-1" onClick={() => setStep(2)}>Back</Button>
              <Button className="flex-1" onClick={submit} disabled={busy}>
                {busy && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {busy ? "Booking…" : "Confirm booking"}
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function ModeOption({
  icon: Icon,
  title,
  desc,
  active,
  badge,
  onClick,
}: {
  icon: any;
  title: string;
  desc: string;
  active: boolean;
  badge?: string;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`flex w-full items-start gap-3 rounded-xl border p-3 text-left transition ${
        active ? "border-primary bg-primary/5" : "border-border bg-card hover:bg-accent"
      }`}
    >
      <div className={`grid h-9 w-9 place-items-center rounded-lg ${active ? "bg-primary text-primary-foreground" : "bg-muted text-foreground"}`}>
        <Icon className="h-4 w-4" />
      </div>
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium">{title}</span>
          {badge && <span className="rounded-full bg-primary/10 px-2 py-0.5 text-[10px] font-semibold text-primary">{badge}</span>}
        </div>
        <p className="text-xs text-muted-foreground">{desc}</p>
      </div>
      {active && <Check className="mt-1 h-4 w-4 text-primary" />}
    </button>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between gap-3">
      <span className="text-muted-foreground">{label}</span>
      <span className="text-right font-medium">{value}</span>
    </div>
  );
}
