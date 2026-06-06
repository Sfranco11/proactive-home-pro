import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { ArrowLeft, Star, MapPin, Phone, Mail, Globe, CalendarPlus } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useServerFn } from "@tanstack/react-start";
import { AppHeader } from "@/components/AppHeader";
import { Button } from "@/components/ui/button";
import { PRO_CATEGORY_MAP } from "@/lib/pro-categories";
import { toast } from "sonner";
import { createBooking } from "@/lib/bookings.functions";

export const Route = createFileRoute("/_app/pros/$id")({
  component: ProDetailPage,
});

interface Provider {
  id: string;
  name: string;
  category: string;
  rating: number | null;
  review_count: number;
  phone: string | null;
  email: string | null;
  website: string | null;
  service_area: string | null;
  description: string | null;
  photo_urls: string[];
  is_premium_only: boolean;
}

function ProDetailPage() {
  const { id } = Route.useParams();
  const navigate = useNavigate();
  const [provider, setProvider] = useState<Provider | null>(null);
  const [loaded, setLoaded] = useState(false);
  const [booking, setBooking] = useState(false);
  const bookFn = useServerFn(createBooking);

  useEffect(() => {
    supabase
      .from("service_providers")
      .select(
        "id, name, category, rating, review_count, phone, email, website, service_area, description, photo_urls, is_premium_only",
      )
      .eq("id", id)
      .maybeSingle()
      .then(({ data }) => {
        setProvider((data as Provider) ?? null);
        setLoaded(true);
      });
  }, [id]);

  if (loaded && !provider) {
    return (
      <>
        <AppHeader title="Pro not found" />
        <main className="container-app py-6">
          <Link to="/pros" className="text-sm text-primary hover:underline">← Back to directory</Link>
        </main>
      </>
    );
  }
  if (!provider) {
    return (
      <>
        <AppHeader title="Loading…" />
      </>
    );
  }

  const cat = PRO_CATEGORY_MAP[provider.category];

  return (
    <>
      <AppHeader title={provider.name} subtitle={cat?.label} />
      <main className="container-app py-5 space-y-5">
        <button
          onClick={() => navigate({ to: "/pros" })}
          className="inline-flex items-center gap-1 text-xs font-medium text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="h-3.5 w-3.5" /> Back to all pros
        </button>

        <div className="rounded-2xl border border-border bg-card p-5 shadow-soft">
          <div className="flex items-start justify-between gap-3">
            <div>
              <h2 className="font-display text-xl font-semibold">{provider.name}</h2>
              <div className="mt-1 flex items-center gap-2 text-sm">
                <span className="inline-flex items-center gap-1 font-semibold">
                  <Star className="h-4 w-4 fill-gold text-gold" />
                  {provider.rating?.toFixed(1) ?? "—"}
                </span>
                <span className="text-muted-foreground">· {provider.review_count} Google reviews</span>
              </div>
            </div>
          </div>

          {provider.service_area && (
            <div className="mt-3 flex items-center gap-1.5 text-sm text-muted-foreground">
              <MapPin className="h-4 w-4" />
              {provider.service_area}
            </div>
          )}

          {provider.description && (
            <p className="mt-4 text-sm leading-relaxed text-foreground">{provider.description}</p>
          )}
        </div>

        <div className="rounded-2xl border border-border bg-card p-5 shadow-soft space-y-3">
          <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Contact</h3>
          {provider.phone && (
            <a
              href={`tel:${provider.phone}`}
              className="flex items-center gap-3 rounded-xl border border-border bg-background px-3 py-2.5 text-sm hover:bg-accent"
            >
              <Phone className="h-4 w-4 text-primary" />
              <span>{provider.phone}</span>
            </a>
          )}
          {provider.email && (
            <a
              href={`mailto:${provider.email}`}
              className="flex items-center gap-3 rounded-xl border border-border bg-background px-3 py-2.5 text-sm hover:bg-accent"
            >
              <Mail className="h-4 w-4 text-primary" />
              <span>{provider.email}</span>
            </a>
          )}
          {provider.website && (
            <a
              href={provider.website}
              target="_blank"
              rel="noreferrer"
              className="flex items-center gap-3 rounded-xl border border-border bg-background px-3 py-2.5 text-sm hover:bg-accent"
            >
              <Globe className="h-4 w-4 text-primary" />
              <span className="truncate">{provider.website.replace(/^https?:\/\//, "")}</span>
            </a>
          )}
          {!provider.phone && !provider.email && !provider.website && (
            <p className="text-sm text-muted-foreground">Contact details available after booking.</p>
          )}
        </div>

        <Button
          size="lg"
          className="w-full"
          disabled={booking || !provider}
          onClick={async () => {
            if (!provider) return;
            setBooking(true);
            try {
              const { id: bookingId } = await bookFn({
                data: { provider_id: provider.id, category: provider.category },
              });
              toast.success("Booking requested");
              navigate({ to: "/bookings/$id", params: { id: bookingId } });
            } catch (e: any) {
              toast.error(e?.message ?? "Could not create booking");
            } finally {
              setBooking(false);
            }
          }}
        >
          <CalendarPlus className="mr-2 h-4 w-4" />
          {booking ? "Requesting…" : "Book service"}
        </Button>
        <p className="text-center text-[11px] text-muted-foreground">
          Live tracking, messaging, and priority scheduling included with Premium.
        </p>
      </main>
    </>
  );
}
