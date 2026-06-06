import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import { ArrowLeft, Camera, Send, X } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth-context";
import { useServerFn } from "@tanstack/react-start";
import { AppHeader } from "@/components/AppHeader";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { cancelBooking } from "@/lib/bookings.functions";

export const Route = createFileRoute("/_app/bookings/$id")({
  component: BookingDetail,
});

const TIMELINE = [
  { key: "requested", label: "Requested" },
  { key: "contacted", label: "Pro contacted" },
  { key: "scheduled", label: "Scheduled" },
  { key: "on_the_way", label: "On the way" },
  { key: "in_progress", label: "In progress" },
  { key: "completed", label: "Completed" },
];

interface Booking {
  id: string;
  status: string;
  category: string;
  scheduled_at: string | null;
  price: number | null;
  eta_minutes: number | null;
  notes: string | null;
  pro_token: string;
  provider: { name: string; phone: string | null; email: string | null } | null;
}
interface Event {
  id: string;
  kind: string;
  status: string | null;
  message: string | null;
  photo_url: string | null;
  created_at: string;
}
interface Message {
  id: string;
  sender: string;
  body: string;
  created_at: string;
}

function BookingDetail() {
  const { id } = Route.useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const cancelFn = useServerFn(cancelBooking);
  const [booking, setBooking] = useState<Booking | null>(null);
  const [events, setEvents] = useState<Event[]>([]);
  const [messages, setMessages] = useState<Message[]>([]);
  const [draft, setDraft] = useState("");
  const [uploading, setUploading] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const load = () => {
    (supabase as any)
      .from("bookings")
      .select(
        "id, status, category, scheduled_at, price, eta_minutes, notes, pro_token, provider:service_providers(name, phone, email)",
      )
      .eq("id", id)
      .maybeSingle()
      .then(({ data }: any) => setBooking(data));
    (supabase as any)
      .from("booking_events")
      .select("id, kind, status, message, photo_url, created_at")
      .eq("booking_id", id)
      .order("created_at", { ascending: true })
      .then(({ data }: any) => setEvents(data ?? []));
    (supabase as any)
      .from("booking_messages")
      .select("id, sender, body, created_at")
      .eq("booking_id", id)
      .order("created_at", { ascending: true })
      .then(({ data }: any) => setMessages(data ?? []));
  };

  useEffect(() => {
    load();
    const channel = supabase
      .channel(`booking-${id}`)
      .on("postgres_changes", { event: "*", schema: "public", table: "bookings", filter: `id=eq.${id}` }, load)
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "booking_events", filter: `booking_id=eq.${id}` }, load)
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "booking_messages", filter: `booking_id=eq.${id}` }, load)
      .subscribe();
    return () => {
      supabase.removeChannel(channel);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  const sendMessage = async () => {
    const body = draft.trim();
    if (!body) return;
    setDraft("");
    const { error } = await (supabase as any)
      .from("booking_messages")
      .insert({ booking_id: id, sender: "homeowner", body });
    if (error) toast.error(error.message);
  };

  const uploadPhoto = async (file: File) => {
    if (!user) return;
    setUploading(true);
    const path = `${user.id}/${id}/${Date.now()}-${file.name.replace(/[^a-zA-Z0-9._-]/g, "_")}`;
    const { error } = await supabase.storage.from("booking-photos").upload(path, file, { upsert: false });
    if (error) {
      toast.error(error.message);
      setUploading(false);
      return;
    }
    const { data: pub } = supabase.storage.from("booking-photos").getPublicUrl(path);
    await (supabase as any).from("booking_events").insert({
      booking_id: id,
      kind: "photo",
      photo_url: pub.publicUrl,
    });
    setUploading(false);
    toast.success("Photo added");
  };

  const doCancel = async () => {
    if (!confirm("Cancel this booking?")) return;
    await cancelFn({ data: { id } });
    toast.success("Booking cancelled");
  };

  if (!booking) {
    return (
      <>
        <AppHeader title="Loading…" />
      </>
    );
  }

  const currentIdx = TIMELINE.findIndex((s) => s.key === booking.status);
  const isTerminal = booking.status === "completed" || booking.status === "cancelled";
  const proLink = `${typeof window !== "undefined" ? window.location.origin : ""}/book/${booking.pro_token}`;

  return (
    <>
      <AppHeader title={booking.provider?.name ?? "Booking"} subtitle={booking.category} />
      <main className="container-app py-5 space-y-5 pb-32">
        <button
          onClick={() => navigate({ to: "/bookings" })}
          className="inline-flex items-center gap-1 text-xs font-medium text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="h-3.5 w-3.5" /> All bookings
        </button>

        {/* Timeline */}
        <section className="rounded-2xl border border-border bg-card p-5 shadow-soft">
          <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Progress</h3>
          <ol className="mt-4 space-y-3">
            {TIMELINE.map((step, i) => {
              const done = !isTerminal && i <= currentIdx;
              const active = !isTerminal && i === currentIdx;
              return (
                <li key={step.key} className="flex items-center gap-3">
                  <span
                    className={`grid h-7 w-7 place-items-center rounded-full text-xs font-semibold ${
                      done ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"
                    } ${active ? "ring-2 ring-primary/40" : ""}`}
                  >
                    {i + 1}
                  </span>
                  <span className={`text-sm ${done ? "font-medium" : "text-muted-foreground"}`}>{step.label}</span>
                  {active && booking.eta_minutes != null && (
                    <span className="ml-auto rounded-full bg-primary/10 px-2 py-0.5 text-xs font-medium text-primary">
                      ETA {booking.eta_minutes}m
                    </span>
                  )}
                </li>
              );
            })}
            {booking.status === "cancelled" && (
              <li className="mt-2 flex items-center gap-2 text-sm text-destructive">
                <X className="h-4 w-4" /> Booking cancelled
              </li>
            )}
          </ol>
          {booking.status === "on_the_way" && (
            <div className="mt-4 rounded-xl border border-dashed border-border bg-muted/30 p-4 text-center text-xs text-muted-foreground">
              Live map preview coming soon
            </div>
          )}
        </section>

        {/* Details */}
        <section className="rounded-2xl border border-border bg-card p-5 shadow-soft space-y-2 text-sm">
          {booking.scheduled_at && (
            <p><span className="text-muted-foreground">Scheduled: </span>{new Date(booking.scheduled_at).toLocaleString()}</p>
          )}
          {booking.price != null && (
            <p><span className="text-muted-foreground">Price: </span>${Number(booking.price).toFixed(2)}</p>
          )}
          {booking.notes && (
            <p><span className="text-muted-foreground">Notes: </span>{booking.notes}</p>
          )}
          {booking.provider?.phone && (
            <p><span className="text-muted-foreground">Pro phone: </span><a href={`tel:${booking.provider.phone}`} className="text-primary hover:underline">{booking.provider.phone}</a></p>
          )}
        </section>

        {/* Photos */}
        <section className="rounded-2xl border border-border bg-card p-5 shadow-soft">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Photos</h3>
            <Button size="sm" variant="outline" disabled={uploading} onClick={() => fileRef.current?.click()}>
              <Camera className="mr-1 h-3.5 w-3.5" /> {uploading ? "Uploading…" : "Add"}
            </Button>
            <input
              type="file"
              accept="image/*"
              hidden
              ref={fileRef}
              onChange={(e) => {
                const f = e.target.files?.[0];
                if (f) uploadPhoto(f);
                e.target.value = "";
              }}
            />
          </div>
          <div className="mt-3 grid grid-cols-3 gap-2">
            {events
              .filter((ev) => ev.kind === "photo" && ev.photo_url)
              .map((ev) => (
                <a key={ev.id} href={ev.photo_url!} target="_blank" rel="noreferrer" className="aspect-square overflow-hidden rounded-lg bg-muted">
                  <img src={ev.photo_url!} alt="" className="h-full w-full object-cover" />
                </a>
              ))}
            {events.filter((ev) => ev.kind === "photo").length === 0 && (
              <p className="col-span-3 text-xs text-muted-foreground">No photos yet.</p>
            )}
          </div>
        </section>

        {/* Messages */}
        <section className="rounded-2xl border border-border bg-card p-5 shadow-soft">
          <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Messages</h3>
          <div className="mt-3 space-y-2 max-h-64 overflow-y-auto">
            {messages.length === 0 && <p className="text-xs text-muted-foreground">No messages yet.</p>}
            {messages.map((m) => (
              <div
                key={m.id}
                className={`max-w-[85%] rounded-2xl px-3 py-2 text-sm ${
                  m.sender === "homeowner" ? "ml-auto bg-primary text-primary-foreground" : "bg-muted"
                }`}
              >
                {m.body}
              </div>
            ))}
          </div>
          <form
            onSubmit={(e) => {
              e.preventDefault();
              sendMessage();
            }}
            className="mt-3 flex gap-2"
          >
            <Input value={draft} onChange={(e) => setDraft(e.target.value)} placeholder="Message the pro…" maxLength={1000} />
            <Button type="submit" size="icon" aria-label="Send">
              <Send className="h-4 w-4" />
            </Button>
          </form>
        </section>

        {/* Share/pro link + cancel */}
        <section className="rounded-2xl border border-dashed border-border p-4 text-xs text-muted-foreground space-y-2">
          <p>Share this link with the pro so they can update status in real time:</p>
          <code className="block break-all rounded bg-muted px-2 py-1 text-[11px] text-foreground">{proLink}</code>
          <Button
            size="sm"
            variant="ghost"
            className="w-full"
            onClick={() => {
              navigator.clipboard.writeText(proLink);
              toast.success("Pro link copied");
            }}
          >
            Copy pro link
          </Button>
        </section>

        {!isTerminal && (
          <Button variant="ghost" className="w-full text-destructive hover:text-destructive" onClick={doCancel}>
            Cancel booking
          </Button>
        )}
      </main>
    </>
  );
}
