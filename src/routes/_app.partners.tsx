import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Phone, Mail, Clock, MapPin, Tag } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth-context";
import { AppHeader } from "@/components/AppHeader";
import { PARTNER_CATEGORIES } from "@/lib/home-systems";

export const Route = createFileRoute("/_app/partners")({
  component: PartnersPage,
});

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

function PartnersPage() {
  const { user } = useAuth();
  const [partners, setPartners] = useState<Partner[]>([]);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    if (!user) return;
    (async () => {
      const { data: h } = await supabase.from("homes").select("realtor_id").eq("owner_id", user.id).maybeSingle();
      if (h?.realtor_id) {
        const { data: ps } = await supabase
          .from("partners")
          .select("*")
          .eq("realtor_id", h.realtor_id)
          .order("category");
        setPartners((ps as Partner[]) ?? []);
      }
      setLoaded(true);
    })();
  }, [user]);

  const grouped = PARTNER_CATEGORIES.map((c) => ({
    ...c,
    partners: partners.filter((p) => p.category === c.key),
  }));

  return (
    <>
      <AppHeader title="Your trusted pros" subtitle="Vetted by your realtor" />
      <main className="container-app py-6 space-y-6">
        {loaded && partners.length === 0 && (
          <div className="rounded-2xl border border-dashed border-border bg-card p-6 text-center text-sm text-muted-foreground">
            Your realtor hasn't added any partners yet. Check back soon.
          </div>
        )}
        {grouped.map(
          (g) =>
            g.partners.length > 0 && (
              <section key={g.key}>
                <h3 className="mb-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">{g.label}</h3>
                <div className="space-y-3">
                  {g.partners.map((p) => (
                    <div key={p.id} className="rounded-2xl border border-border bg-card p-4 shadow-soft">
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <div className="font-display font-semibold">{p.name}</div>
                          {p.response_time && (
                            <div className="mt-0.5 flex items-center gap-1 text-[11px] text-muted-foreground">
                              <Clock className="h-3 w-3" /> {p.response_time}
                            </div>
                          )}
                        </div>
                        {p.discount_code && (
                          <span className="flex items-center gap-1 rounded-full bg-gold/15 px-2 py-0.5 text-[10px] font-semibold text-gold-foreground">
                            <Tag className="h-3 w-3" /> {p.discount_code}
                          </span>
                        )}
                      </div>
                      {(p.service_area || p.hours) && (
                        <div className="mt-2 space-y-0.5 text-xs text-muted-foreground">
                          {p.service_area && (
                            <div className="flex items-center gap-1"><MapPin className="h-3 w-3" /> {p.service_area}</div>
                          )}
                          {p.hours && (
                            <div className="flex items-center gap-1"><Clock className="h-3 w-3" /> {p.hours}</div>
                          )}
                        </div>
                      )}
                      {p.notes && <p className="mt-2 text-sm text-muted-foreground">{p.notes}</p>}
                      <div className="mt-3 flex gap-2">
                        {p.phone && (
                          <a
                            href={`tel:${p.phone}`}
                            className="flex flex-1 items-center justify-center gap-1.5 rounded-xl bg-primary px-3 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90"
                          >
                            <Phone className="h-4 w-4" /> Call
                          </a>
                        )}
                        {p.email && (
                          <a
                            href={`mailto:${p.email}`}
                            className="flex flex-1 items-center justify-center gap-1.5 rounded-xl border border-border bg-background px-3 py-2 text-sm font-medium hover:bg-accent"
                          >
                            <Mail className="h-4 w-4" /> Email
                          </a>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </section>
            ),
        )}
      </main>
    </>
  );
}
