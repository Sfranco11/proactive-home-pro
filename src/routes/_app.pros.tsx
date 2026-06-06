import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { Star, Lock, MapPin, Search as SearchIcon } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { AppHeader } from "@/components/AppHeader";
import { Input } from "@/components/ui/input";
import { PRO_CATEGORIES, PRO_CATEGORY_MAP, FREE_PER_CATEGORY } from "@/lib/pro-categories";
import { usePremium } from "@/hooks/usePremium";

export const Route = createFileRoute("/_app/pros")({
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
}

function ProsDirectoryPage() {
  const [providers, setProviders] = useState<Provider[]>([]);
  const [category, setCategory] = useState<string>("all");
  const [query, setQuery] = useState("");
  const [loaded, setLoaded] = useState(false);

  // Premium gating wires up in Phase 2. For now everyone is free-tier.
  const { isPremium } = usePremium();

  useEffect(() => {
    supabase
      .from("service_providers")
      .select("id, name, category, rating, review_count, service_area, description, is_premium_only, sort_rank")
      .eq("active", true)
      .order("sort_rank", { ascending: false })
      .then(({ data }) => {
        setProviders((data as Provider[]) ?? []);
        setLoaded(true);
      });
  }, []);

  const filtered = useMemo(() => {
    let list = providers;
    if (category !== "all") list = list.filter((p) => p.category === category);
    if (query.trim()) {
      const q = query.toLowerCase();
      list = list.filter(
        (p) =>
          p.name.toLowerCase().includes(q) ||
          (p.description ?? "").toLowerCase().includes(q) ||
          (p.service_area ?? "").toLowerCase().includes(q),
      );
    }
    return list;
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
      <AppHeader title="Recommended pros" subtitle="Top-rated in Vaughan & the GTA" />
      <main className="container-app py-5 space-y-5">
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
            <CategoryChip active={category === "all"} onClick={() => setCategory("all")}>
              All
            </CategoryChip>
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
            No pros match your search.
          </div>
        )}

        {category === "all"
          ? PRO_CATEGORIES.map((c) => {
              const list = grouped.get(c.key) ?? [];
              if (list.length === 0) return null;
              return (
                <CategorySection
                  key={c.key}
                  categoryKey={c.key}
                  list={list}
                  isPremium={isPremium}
                  onSeeAll={() => setCategory(c.key)}
                />
              );
            })
          : (() => {
              const list = grouped.get(category) ?? [];
              return (
                <CategorySection
                  key={category}
                  categoryKey={category}
                  list={list}
                  isPremium={isPremium}
                  showAll
                />
              );
            })()}
      </main>
    </>
  );
}

function CategoryChip({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      onClick={onClick}
      className={`inline-flex shrink-0 items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-medium transition-colors ${
        active
          ? "border-primary bg-primary text-primary-foreground"
          : "border-border bg-card text-foreground hover:bg-accent"
      }`}
    >
      {children}
    </button>
  );
}

function CategorySection({
  categoryKey,
  list,
  isPremium,
  showAll,
  onSeeAll,
}: {
  categoryKey: string;
  list: Provider[];
  isPremium: boolean;
  showAll?: boolean;
  onSeeAll?: () => void;
}) {
  const cat = PRO_CATEGORY_MAP[categoryKey];
  if (!cat) return null;
  const Icon = cat.icon;
  const visible = showAll ? list : list.slice(0, FREE_PER_CATEGORY + 1); // +1 to show one locked teaser

  return (
    <section>
      <div className="mb-2 flex items-end justify-between">
        <div>
          <h3 className="flex items-center gap-2 font-display text-base font-semibold">
            <Icon className="h-4 w-4 text-primary" />
            {cat.label}
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
        {visible.map((p, i) => {
          const locked = !isPremium && (p.is_premium_only || i >= FREE_PER_CATEGORY);
          return <ProviderCard key={p.id} provider={p} locked={locked} />;
        })}
      </div>
    </section>
  );
}

function ProviderCard({ provider, locked }: { provider: Provider; locked: boolean }) {
  const body = (
    <div
      className={`rounded-2xl border border-border bg-card p-4 shadow-soft transition ${
        locked ? "opacity-90" : "hover:-translate-y-0.5 hover:shadow-md"
      }`}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <h4 className="truncate font-display font-semibold">{provider.name}</h4>
            {locked && <Lock className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />}
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
      {provider.service_area && (
        <div className="mt-2 flex items-center gap-1 text-[11px] text-muted-foreground">
          <MapPin className="h-3 w-3" />
          {provider.service_area}
        </div>
      )}
      {provider.description && (
        <p className="mt-2 line-clamp-2 text-sm text-muted-foreground">{provider.description}</p>
      )}
      <div className="mt-3 flex items-center justify-between">
        <span
          className={`text-xs font-medium ${
            locked ? "text-muted-foreground" : "text-primary"
          }`}
        >
          {locked ? "Premium · Unlock to book" : "View & book →"}
        </span>
      </div>
    </div>
  );

  if (locked) {
    return (
      <Link to="/upgrade" className="block">
        {body}
      </Link>
    );
  }
  return (
    <Link to="/pros/$id" params={{ id: provider.id }} className="block">
      {body}
    </Link>
  );
}
