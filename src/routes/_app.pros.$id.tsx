import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { ArrowLeft, Star, MapPin, Phone, Mail, Globe, CalendarPlus, ShieldCheck, BadgeCheck, Clock } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { AppHeader } from "@/components/AppHeader";
import { Button } from "@/components/ui/button";
import { PRO_CATEGORY_MAP } from "@/lib/pro-categories";
import { BookingWizard } from "@/components/BookingWizard";

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
  licensed: boolean;
  insured: boolean;
  verified: boolean;
  response_time_minutes: number | null;
  years_in_business: number | null;
}

function ProDetailPage() {
  const { id } = Route.useParams();
  const navigate = useNavigate();
  const [provider, setProvider] = useState<Provider | null>(null);
  const [loaded, setLoaded] = useState(false);
  const [showWizard, setShowWizard] = useState(false);

  useEffect(() => {
    (supabase as any).from("service_providers")
      .select("id, name, category, rating, review_count, phone, email, website, service_area, description, photo_urls, is_premium_only, licensed, insured, verified, response_time_minutes, years_in_business")
      .eq("id", id).maybeSingle()
      .then(({ data }: any) => { setProvider((data as Provider) ?? null); setLoaded(true); });
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
  if (!provider) return <AppHeader title="Loading…" />;

  const cat = PRO_CATEGORY_MAP[provider.category];

  return (
    <>
      <AppHeader title={provider.name} subtitle={cat?.label} />
      <main className="container-app py-5 space-y-5 pb-32">
        <button
          onClick={() => navigate({ to: "/pros" })}
          className="inline-flex items-center gap-1 text-xs font-medium text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="h-3.5 w-3.5" /> Back to all pros
        </button>

        <div className="rounded-2xl border border-border bg-card p-5 shadow-soft">
          <div className="flex items-start justify-between gap-3">
            <div>
              <div className="flex items-center gap-2">
                <h2 className="font-display text-xl font-semibold">{provider.name}</h2>
                {provider.verified && <BadgeCheck className="h-5 w-5 text-primary" />}
              </div>
              <div className="mt-1 flex items-center gap-2 text-sm">
                <span className="inline-flex items-center gap-1 font-semibold">
                  <Star className="h-4 w-4 fill-gold text-gold" />
                  {provider.rating?.toFixed(1) ?? "—"}
                </span>
                <span className="text-muted-foreground">· {provider.review_count} reviews</span>
              </div>
            </div>
          </div>

          <div className="mt-3 flex flex-wrap gap-3 text-xs text-muted-foreground">
            {provider.service_area && <span className="inline-flex items-center gap-1"><MapPin className="h-3.5 w-3.5" />{provider.service_area}</span>}
            {provider.licensed && <span className="inline-flex items-center gap-1"><ShieldCheck className="h-3.5 w-3.5 text-emerald-600" />Licensed</span>}
            {provider.insured && <span className="inline-flex items-center gap-1"><ShieldCheck className="h-3.5 w-3.5 text-emerald-600" />Insured</span>}
            {provider.response_time_minutes != null && (
              <span className="inline-flex items-center gap-1"><Clock className="h-3.5 w-3.5" />Replies in ~{provider.response_time_minutes}m</span>
            )}
            {provider.years_in_business != null && <span>{provider.years_in_business} yrs in business</span>}
          </div>

          {provider.description && (
            <p className="mt-4 text-sm leading-relaxed text-foreground">{provider.description}</p>
          )}
        </div>

        <div className="rounded-2xl border border-border bg-card p-5 shadow-soft space-y-3">
          <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Contact</h3>
          {provider.phone && (
            <a href={`tel:${provider.phone}`} className="flex items-center gap-3 rounded-xl border border-border bg-background px-3 py-2.5 text-sm hover:bg-accent">
              <Phone className="h-4 w-4 text-primary" /><span>{provider.phone}</span>
            </a>
          )}
          {provider.email && (
            <a href={`mailto:${provider.email}`} className="flex items-center gap-3 rounded-xl border border-border bg-background px-3 py-2.5 text-sm hover:bg-accent">
              <Mail className="h-4 w-4 text-primary" /><span>{provider.email}</span>
            </a>
          )}
          {provider.website && (
            <a href={provider.website} target="_blank" rel="noreferrer" className="flex items-center gap-3 rounded-xl border border-border bg-background px-3 py-2.5 text-sm hover:bg-accent">
              <Globe className="h-4 w-4 text-primary" /><span className="truncate">{provider.website.replace(/^https?:\/\//, "")}</span>
            </a>
          )}
        </div>

        <div className="fixed inset-x-0 bottom-16 z-30 border-t border-border bg-card/95 p-3 backdrop-blur">
          <div className="container-app">
            <Button size="lg" className="w-full" onClick={() => setShowWizard(true)}>
              <CalendarPlus className="mr-2 h-4 w-4" /> Book this pro
            </Button>
            <p className="mt-1 text-center text-[10px] text-muted-foreground">
              Pick a date, time, and one-time or AutoPilot schedule.
            </p>
          </div>
        </div>

        {showWizard && (
          <BookingWizard
            providerId={provider.id}
            providerName={provider.name}
            category={provider.category}
            onClose={() => setShowWizard(false)}
          />
        )}
      </main>
    </>
  );
}
