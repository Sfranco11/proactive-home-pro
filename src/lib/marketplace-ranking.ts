export interface RankableProvider {
  rating: number | null;
  review_count: number;
  response_time_minutes?: number | null;
  licensed?: boolean;
  insured?: boolean;
  verified?: boolean;
  years_in_business?: number | null;
  sort_rank: number;
  isRealtorPreferred?: boolean;
}

/**
 * Composite ranking score. Higher is better.
 * Realtor-preferred pros always sort above marketplace pros.
 */
export function providerScore(p: RankableProvider): number {
  const rating = (p.rating ?? 0) * 20; // up to 100
  const volume = Math.min(p.review_count, 200) * 0.25; // up to 50
  const trust = (p.licensed ? 12 : 0) + (p.insured ? 12 : 0) + (p.verified ? 10 : 0);
  const speed = p.response_time_minutes != null
    ? Math.max(0, 30 - Math.min(30, p.response_time_minutes / 5))
    : 0;
  const tenure = Math.min(p.years_in_business ?? 0, 25) * 0.6;
  const editorial = p.sort_rank;
  const preferred = p.isRealtorPreferred ? 10_000 : 0;
  return preferred + rating + volume + trust + speed + tenure + editorial;
}

export function rankProviders<T extends RankableProvider>(list: T[]): T[] {
  return [...list].sort((a, b) => providerScore(b) - providerScore(a));
}
