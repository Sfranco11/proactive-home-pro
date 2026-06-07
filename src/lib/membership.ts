// Membership tiers + helpers (shared by client and server fns).
export type MemberTier = "none" | "premium" | "complete";

export const TIER_PRICE_IDS: Record<Exclude<MemberTier, "none">, string> = {
  premium: "premium_annual",
  complete: "complete_annual",
};

export const TIER_LABELS: Record<MemberTier, string> = {
  none: "Free",
  premium: "Premium",
  complete: "Complete",
};

export const TIER_PRICE_CENTS: Record<Exclude<MemberTier, "none">, number> = {
  premium: 24_900,
  complete: 154_800,
};

// One-time brokerage bounty paid when a referred homeowner converts.
export const BOUNTY_CENTS: Record<Exclude<MemberTier, "none">, number> = {
  premium: 5_000, // $50
  complete: 7_500, // $75
};

// Loyalty credit by member-year (year 1 = signup, granted on each renewal cycle thereafter).
export function loyaltyCreditForYear(memberYear: number): number {
  if (memberYear <= 1) return 0;
  if (memberYear === 2) return 5_000; // $50
  if (memberYear === 3) return 10_000; // $100
  return 15_000; // $150 from year 4 onwards
}

export function tierFromPriceId(priceId: string | null | undefined): MemberTier {
  if (!priceId) return "none";
  if (priceId === "complete_annual" || priceId === "complete_yearly") return "complete";
  if (
    priceId === "premium_annual" ||
    priceId === "premium_yearly" ||
    priceId === "premium_monthly"
  )
    return "premium";
  return "none";
}

export function tierIncludes(tier: MemberTier, feature: "booking" | "yard_care" | "concierge"): boolean {
  if (tier === "none") return false;
  if (feature === "yard_care") return tier === "complete";
  return true;
}
