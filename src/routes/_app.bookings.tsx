import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { CalendarClock, ChevronRight } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth-context";
import { AppHeader } from "@/components/AppHeader";

export const Route = createFileRoute("/_app/bookings")({
  component: BookingsList,
});

const STATUS_LABEL: Record<string, string> = {
  requested: "Requested",
  contacted: "Contacted",
  scheduled: "Scheduled",
  confirmed: "Confirmed",
  on_the_way: "On the way",
  arrived: "Arrived",
  in_progress: "In progress",
  completed: "Completed",
  cancelled: "Cancelled",
};

const STATUS_TONE: Record<string, string> = {
  requested: "bg-muted text-foreground",
  contacted: "bg-muted text-foreground",
  scheduled: "bg-accent text-accent-foreground",
  confirmed: "bg-accent text-accent-foreground",
  on_the_way: "bg-primary text-primary-foreground",
  arrived: "bg-primary text-primary-foreground",
  in_progress: "bg-primary text-primary-foreground",
  completed: "bg-emerald-600 text-white",
  cancelled: "bg-destructive/15 text-destructive",
};

interface Row {
  id: string;
  category: string;
  status: string;
  scheduled_at: string | null;
  created_at: string;
  provider: { name: string } | null;
}

function BookingsList() {
  const { user } = useAuth();
  const [rows, setRows] = useState<Row[] | null>(null);

  useEffect(() => {
    if (!user) return;
    (supabase as any)
      .from("bookings")
      .select("id, category, status, scheduled_at, created_at, provider:service_providers(name)")
      .eq("homeowner_id", user.id)
      .order("created_at", { ascending: false })
      .then(({ data }: any) => setRows(data ?? []));

    const channel = supabase
      .channel(`bookings-${user.id}`)
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "bookings", filter: `homeowner_id=eq.${user.id}` },
        () => {
          (supabase as any)
            .from("bookings")
            .select("id, category, status, scheduled_at, created_at, provider:service_providers(name)")
            .eq("homeowner_id", user.id)
            .order("created_at", { ascending: false })
            .then(({ data }: any) => setRows(data ?? []));
        },
      )
      .subscribe();
    return () => {
      supabase.removeChannel(channel);
    };
  }, [user]);

  return (
    <>
      <AppHeader title="My bookings" subtitle="Live status updates from your pros" />
      <main className="container-app py-5 space-y-3">
        {rows === null && <p className="text-sm text-muted-foreground">Loading…</p>}
        {rows && rows.length === 0 && (
          <div className="rounded-2xl border border-dashed border-border p-8 text-center">
            <CalendarClock className="mx-auto h-8 w-8 text-muted-foreground" />
            <h2 className="mt-3 font-display text-lg font-semibold">No bookings yet</h2>
            <p className="mt-1 text-sm text-muted-foreground">Browse the pros directory to book your first service.</p>
            <Link to="/pros" className="mt-4 inline-block text-sm font-medium text-primary hover:underline">
              Browse pros →
            </Link>
          </div>
        )}
        {rows?.map((b) => (
          <Link
            key={b.id}
            to="/bookings/$id"
            params={{ id: b.id }}
            className="flex items-center justify-between gap-3 rounded-2xl border border-border bg-card p-4 shadow-soft hover:bg-accent/30"
          >
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <span className={`rounded-full px-2 py-0.5 text-[10px] font-semibold ${STATUS_TONE[b.status] ?? "bg-muted"}`}>
                  {STATUS_LABEL[b.status] ?? b.status}
                </span>
                <span className="truncate text-sm font-medium">{b.provider?.name ?? "Provider"}</span>
              </div>
              <p className="mt-1 truncate text-xs text-muted-foreground">
                {b.category}
                {b.scheduled_at && ` · ${new Date(b.scheduled_at).toLocaleString()}`}
              </p>
            </div>
            <ChevronRight className="h-4 w-4 text-muted-foreground" />
          </Link>
        ))}
      </main>
    </>
  );
}
