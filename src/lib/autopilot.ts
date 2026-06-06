export type Cadence =
  | "weekly"
  | "monthly"
  | "quarterly"
  | "biannual"
  | "annual"
  | "seasonal_winter"
  | "seasonal_summer";

export interface AutoPilotPreset {
  key: string;
  category: string;
  label: string;
  cadence: Cadence;
  blurb: string;
  intervalDays: number;
}

export const AUTOPILOT_PRESETS: AutoPilotPreset[] = [
  { key: "lawn", category: "landscapers", label: "Lawn care", cadence: "weekly", blurb: "Weekly mow & trim in season", intervalDays: 7 },
  { key: "snow", category: "landscapers", label: "Snow removal", cadence: "seasonal_winter", blurb: "Each snowfall, Nov–Mar", intervalDays: 14 },
  { key: "hvac_filter", category: "handymen", label: "HVAC filter swap", cadence: "quarterly", blurb: "Every 3 months", intervalDays: 90 },
  { key: "furnace", category: "handymen", label: "Furnace inspection", cadence: "annual", blurb: "Once a year, fall", intervalDays: 365 },
  { key: "gutter", category: "handymen", label: "Gutter cleaning", cadence: "biannual", blurb: "Spring & fall", intervalDays: 182 },
  { key: "pest", category: "handymen", label: "Pest control", cadence: "quarterly", blurb: "Every 3 months", intervalDays: 90 },
  { key: "pool", category: "landscapers", label: "Pool maintenance", cadence: "seasonal_summer", blurb: "Weekly, May–Sep", intervalDays: 7 },
  { key: "cleaning", category: "cleaners", label: "House cleaning", cadence: "monthly", blurb: "Monthly deep clean", intervalDays: 30 },
];

export const CADENCE_LABEL: Record<Cadence, string> = {
  weekly: "Weekly",
  monthly: "Monthly",
  quarterly: "Every 3 months",
  biannual: "Twice a year",
  annual: "Annually",
  seasonal_winter: "Winter season",
  seasonal_summer: "Summer season",
};

export function nextRunFromCadence(cadence: Cadence, from: Date = new Date()): Date {
  const days =
    cadence === "weekly" ? 7 :
    cadence === "monthly" ? 30 :
    cadence === "quarterly" ? 90 :
    cadence === "biannual" ? 182 :
    cadence === "annual" ? 365 :
    cadence === "seasonal_winter" ? 14 :
    7;
  const d = new Date(from);
  d.setDate(d.getDate() + days);
  return d;
}
