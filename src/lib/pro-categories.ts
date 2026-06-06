import {
  Truck,
  Sparkles,
  Paintbrush,
  Wrench,
  Zap,
  Droplets,
  HardHat,
  Trees,
  Sofa,
  Banknote,
  Scale,
  Search,
  type LucideIcon,
} from "lucide-react";

export interface ProCategory {
  key: string;
  label: string;
  icon: LucideIcon;
  blurb: string;
}

export const PRO_CATEGORIES: ProCategory[] = [
  { key: "movers", label: "Movers", icon: Truck, blurb: "Moving day, packing & storage" },
  { key: "cleaners", label: "Cleaners", icon: Sparkles, blurb: "Deep cleans & recurring service" },
  { key: "painters", label: "Painters", icon: Paintbrush, blurb: "Interior & exterior painting" },
  { key: "handymen", label: "Handymen", icon: Wrench, blurb: "Small repairs & odd jobs" },
  { key: "electricians", label: "Electricians", icon: Zap, blurb: "ESA-licensed electrical" },
  { key: "plumbers", label: "Plumbers", icon: Droplets, blurb: "Leaks, drains & water heaters" },
  { key: "contractors", label: "Contractors", icon: HardHat, blurb: "Renovations & additions" },
  { key: "landscapers", label: "Landscapers", icon: Trees, blurb: "Lawn, garden & hardscape" },
  { key: "stagers", label: "Home Stagers", icon: Sofa, blurb: "Stage for a faster sale" },
  { key: "mortgage_brokers", label: "Mortgage Brokers", icon: Banknote, blurb: "Best-rate mortgage advice" },
  { key: "lawyers", label: "Lawyers", icon: Scale, blurb: "Real estate closings" },
  { key: "inspectors", label: "Home Inspectors", icon: Search, blurb: "Pre-purchase inspections" },
];

export const PRO_CATEGORY_MAP: Record<string, ProCategory> = Object.fromEntries(
  PRO_CATEGORIES.map((c) => [c.key, c]),
);

export const FREE_PER_CATEGORY = 2;
