import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { Star, Lock, MapPin, Search as SearchIcon, ShieldCheck, BadgeCheck, Clock, CalendarPlus } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth-context";
import { AppHeader } from "@/components/AppHeader";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { PRO_CATEGORIES, PRO_CATEGORY_MAP, FREE_PER_CATEGORY } from "@/lib/pro-categories";
import { usePremium } from "@/hooks/usePremium";
import { rankProviders } from "@/lib/marketplace-ranking";
import { BookingWizard } from "@/components/BookingWizard";

export const Route = createFileRoute("/_app/pros")({
  validateSearch: (s: Record<string, unknown>) => ({
    category: typeof s.category === "string" ? s.category : undefined,
  }),
  component: ProsDirectoryPage,
});

interface Provider {
  id: string;
  name: string;
  category: string;
  rating: number | null;
  review_count: number;
  service_area: string | null;
  description: string | null;
  is_premium_only: boolean;
  sort_rank: number;
  licensed: boolean;
  insured: boolean;
  verified: boolean;
  response_time_minutes: number | null;
  years_in_business: number | null;
  isRealtorPreferred?: boolean;
}

function ProsDirectoryPage() {
  const search = Route.useSearch();
  const { user } = useAuth();
  const [providers, setProviders] = useState<Provider[]>([]);
  const [preferredIds, setPreferredIds] = useState<Set<string>>(new Set());
  const [category, setCategory] = useState<string>(search.category ?? "all");
  const [query, setQuery] = useState("");
  const [loaded, setLoaded] = useState(false);
  const [bookingFor, setBookingFor] = useState<Provider | null>(null);
  const { isPremium } = usePremium();

  useEffect(() => {
    (async () => {
      const { data } = await (supabase as any)
        .from("service_providers")
        .select("id, name, category, rating, review_count, service_area, description, is_premium_only, sort_rank, licensed, insured, verified, response_time_minutes, years_in_business")
        .eq("active", true);

      // Flag pros that the homeowner's realtor has explicitly recommended.
      let preferred = new Set<string>();
      if (user) {
        const { data: home } = await supabase.from("homes").select("realtor_id").eq("owner_id", user.id).maybeSingle();
        if (home?.realtor_id) {
          const { data: partners } = await supabase
            .from("partners_homeowner_safe" as any).select("name").eq("realtor_id", home.realtor_id);
          const partnerNames = new Set((partners ?? []).map((p: any) => p.name.toLowerCase()));
          preferred = new Set((data ?? []).filter((p: any) => partnerNames.has(p.name.toLowerCase())).map((p: any) => p.id));
        }
      }
      setPreferredIds(preferred);
      setProviders((data ?? []).map((p: any) => ({ ...p, isRealtorPreferred: preferred.has(p.id) })));
      setLoaded(true);
    })();
  }, [user]);

  const filtered = useMemo(() => {
    let list = providers;
    if (category !== "all") list = list.filter((p) => p.category === category);
    if (query.trim()) {
      const q = query.toLowerCase();
      list = list.filter(
        (p) => p.name.toLowerCase().includes(q) ||
          (p.description ?? "").toLowerCase().includes(q) ||
          (p.service_area ?? "").toLowerCase().includes(q),
      );
    }
    return rankProviders(list);
  }, [providers, category, query]);

  const grouped = useMemo(() => {
    const m = new Map<string, Provider[]>();
    filtered.forEach((p) => {
      const arr = m.get(p.category) ?? [];
      arr.push(p);
      m.set(p.category, arr);
    });
    return m;
  }, [filtered]);

  return (
    <>
      <AppHeader title="Find a pro" subtitle="Vetted, ranked, and ready to book" />
      <main className="container-app py-5 space-y-5 pb-32">
        <div className="relative">
          <SearchIcon className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search pros, services, or area…"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="pl-9"
          />
        </div>

        <div className="-mx-4 overflow-x-auto px-4">
          <div className="flex gap-2 pb-1">
            <CategoryChip active={category === "all"} onClick={() => setCategory("all")}>All</CategoryChip>
            {PRO_CATEGORIES.map((c) => {
              const Icon = c.icon;
              return (
                <CategoryChip key={c.key} active={category === c.key} onClick={() => setCategory(c.key)}>
                  <Icon className="h-3.5 w-3.5" />
                  {c.label}
                </CategoryChip>
              );
            })}
          </div>
        </div>

        {!loaded && <div className="text-sm text-muted-foreground">Loading pros…</div>}

        {loaded && filtered.length === 0 && (
          <div className="rounded-2xl border border-dashed border-border bg-card p-6 text-center text-sm text-muted-foreground">
            No pros match your search. Try a different category.
          </div>
        )}

        {category === "all"
          ? PRO_CATEGORIES.map((c) => {
              const list = grouped.get(c.key) ?? [];
              if (list.length === 0) return null;
              return (
                <CategorySection key={c.key} categoryKey={c.key} list={list} isPremium={isPremium} onSeeAll={() => setCategory(c.key)} onBook={setBookingFor} />
              );
            })
          : (() => {
              const list = grouped.get(category) ?? [];
              return <CategorySection key={category} categoryKey={category} list={list} isPremium={isPremium} showAll onBook={setBookingFor} />;
            })()}
      </main>

      {bookingFor && (
        <BookingWizard
          providerId={bookingFor.id}
          providerName={bookingFor.name}
          category={bookingFor.category}
          onClose={() => setBookingFor(null)}
        />
      )}
    </>
  );
}

function CategoryChip({ active, onClick, children }: { active: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      onClick={onClick}
      className={`inline-flex shrink-0 items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-medium transition-colors ${
        active ? "border-primary bg-primary text-primary-foreground" : "border-border bg-card text-foreground hover:bg-accent"
      }`}
    >
      {children}
    </button>
  );
}

function CategorySection({
  categoryKey, list, isPremium, showAll, onSeeAll, onBook,
}: {
  categoryKey: string;
  list: Provider[];
  isPremium: boolean;
  showAll?: boolean;
  onSeeAll?: () => void;
  onBook: (p: Provider) => void;
}) {
  const cat = PRO_CATEGORY_MAP[categoryKey];
  if (!cat) return null;
  const Icon = cat.icon;
  const visible = showAll ? list : list.slice(0, FREE_PER_CATEGORY + 1);
  const preferred = visible.filter((p) => p.isRealtorPreferred);
  const others = visible.filter((p) => !p.isRealtorPreferred);

  return (
    <section>
      <div className="mb-2 flex items-end justify-between">
        <div>
          <h3 className="flex items-center gap-2 font-display text-base font-semibold">
            <Icon className="h-4 w-4 text-primary" /> {cat.label}
          </h3>
          <p className="text-[11px] text-muted-foreground">{cat.blurb}</p>
        </div>
        {!showAll && list.length > FREE_PER_CATEGORY && onSeeAll && (
          <button onClick={onSeeAll} className="text-xs font-medium text-primary hover:underline">
            See all {list.length}
          </button>
        )}
      </div>
      <div className="space-y-3">
        {preferred.length > 0 && (
          <div className="text-[11px] font-semibold uppercase tracking-wider text-primary">Recommended by your realtor</div>
        )}
        {preferred.map((p) => <ProviderCard key={p.id} provider={p} locked={false} onBook={onBook} />)}
        {preferred.length > 0 && others.length > 0 && (
          <div className="pt-2 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">More vetted pros</div>
        )}
        {others.map((p, i) => {
          const locked = !isPremium && (p.is_premium_only || i >= FREE_PER_CATEGORY);
          return <ProviderCard key={p.id} provider={p} locked={locked} onBook={onBook} />;
        })}
      </div>
    </section>
  );
}

function ProviderCard({ provider, locked, onBook }: { provider: Provider; locked: boolean; onBook: (p: Provider) => void }) {
  return (
    <div className={`rounded-2xl border border-border bg-card p-4 shadow-soft transition ${locked ? "opacity-90" : "hover:-translate-y-0.5 hover:shadow-md"}`}>
      <Link
        to="/pros/$id"
        params={{ id: provider.id }}
        className="block"
        onClick={(e) => { if (locked) e.preventDefault(); }}
      >
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2">
              <h4 className="truncate font-display font-semibold">{provider.name}</h4>
              {locked && <Lock className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />}
              {provider.verified && !locked && <BadgeCheck className="h-3.5 w-3.5 shrink-0 text-primary" />}
            </div>
            <div className="mt-1 flex items-center gap-2 text-xs text-muted-foreground">
              <span className="inline-flex items-center gap-1 font-medium text-foreground">
                <Star className="h-3.5 w-3.5 fill-gold text-gold" />
                {provider.rating?.toFixed(1) ?? "—"}
              </span>
              <span>· {provider.review_count} reviews</span>
            </div>
          </div>
        </div>
        <div className="mt-2 flex flex-wrap items-center gap-2 text-[11px] text-muted-foreground">
          {provider.service_area && (
            <span className="inline-flex items-center gap-1"><MapPin className="h-3 w-3" />{provider.service_area}</span>
          )}
          {provider.licensed && (
            <span className="inline-flex items-center gap-1"><ShieldCheck className="h-3 w-3 text-emerald-600" />Licensed</span>
          )}
          {provider.insured && (
            <span className="inline-flex items-center gap-1"><ShieldCheck className="h-3 w-3 text-emerald-600" />Insured</span>
          )}
          {provider.response_time_minutes != null && (
            <span className="inline-flex items-center gap-1"><Clock className="h-3 w-3" />~{provider.response_time_minutes}m response</span>
          )}
        </div>
        {provider.description && (
          <p className="mt-2 line-clamp-2 text-sm text-muted-foreground">{provider.description}</p>
        )}
      </Link>
      <div className="mt-3">
        {locked ? (
          <Link to="/upgrade" className="block">
            <Button variant="outline" size="sm" className="w-full">
              <Lock className="mr-1.5 h-3.5 w-3.5" /> Premium · Unlock to book
            </Button>
          </Link>
        ) : (
          <Button size="sm" className="w-full" onClick={() => onBook(provider)}>
            <CalendarPlus className="mr-1.5 h-3.5 w-3.5" /> Book now
          </Button>
        )}
      </div>
    </div>
  );
}
