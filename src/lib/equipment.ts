import {
  Wind, Flame, Droplets, Home as HomeIcon, Snowflake,
  Refrigerator, WashingMachine, UtensilsCrossed, Filter,
  BellRing, ShowerHead, Wrench
} from "lucide-react";

export type EquipmentCategory = "system" | "appliance" | "consumable" | "custom";

export interface EquipmentPreset {
  type: string;
  name: string;
  category: EquipmentCategory;
  icon: typeof Wind;
  expectedLifespanMonths: number;
  serviceIntervalMonths?: number;
  partnerCategory?: string;
  description?: string;
}

export const EQUIPMENT_PRESETS: EquipmentPreset[] = [
  // Core systems
  { type: "hvac_furnace", name: "Furnace", category: "system", icon: Flame, expectedLifespanMonths: 20 * 12, serviceIntervalMonths: 12, partnerCategory: "hvac", description: "Gas/oil/electric furnace" },
  { type: "hvac_ac", name: "Air Conditioner", category: "system", icon: Snowflake, expectedLifespanMonths: 15 * 12, serviceIntervalMonths: 12, partnerCategory: "hvac" },
  { type: "hvac_heatpump", name: "Heat Pump", category: "system", icon: Wind, expectedLifespanMonths: 12 * 12, serviceIntervalMonths: 12, partnerCategory: "hvac" },
  { type: "water_heater", name: "Water Heater", category: "system", icon: ShowerHead, expectedLifespanMonths: 10 * 12, serviceIntervalMonths: 12, partnerCategory: "plumbing" },
  { type: "water_softener", name: "Water Softener", category: "system", icon: Droplets, expectedLifespanMonths: 12 * 12, serviceIntervalMonths: 6, partnerCategory: "plumbing" },
  { type: "sump_pump", name: "Sump Pump", category: "system", icon: Droplets, expectedLifespanMonths: 10 * 12, serviceIntervalMonths: 12, partnerCategory: "plumbing" },
  { type: "roof_asphalt", name: "Roof (asphalt shingle)", category: "system", icon: HomeIcon, expectedLifespanMonths: 25 * 12, partnerCategory: "roofing" },
  { type: "roof_metal", name: "Roof (metal)", category: "system", icon: HomeIcon, expectedLifespanMonths: 50 * 12, partnerCategory: "roofing" },

  // Appliances
  { type: "fridge", name: "Refrigerator", category: "appliance", icon: Refrigerator, expectedLifespanMonths: 13 * 12, partnerCategory: "general" },
  { type: "dishwasher", name: "Dishwasher", category: "appliance", icon: UtensilsCrossed, expectedLifespanMonths: 10 * 12, partnerCategory: "general" },
  { type: "washer", name: "Washing Machine", category: "appliance", icon: WashingMachine, expectedLifespanMonths: 11 * 12, partnerCategory: "general" },
  { type: "dryer", name: "Dryer", category: "appliance", icon: WashingMachine, expectedLifespanMonths: 13 * 12, serviceIntervalMonths: 12, partnerCategory: "general", description: "Annual vent cleaning recommended" },
  { type: "oven", name: "Oven / Range", category: "appliance", icon: Flame, expectedLifespanMonths: 15 * 12, partnerCategory: "general" },

  // Consumables (Dyson-style replace reminders)
  { type: "hvac_filter", name: "HVAC Filter", category: "consumable", icon: Filter, expectedLifespanMonths: 3, serviceIntervalMonths: 3, partnerCategory: "hvac", description: "Replace every 3 months" },
  { type: "water_filter", name: "Water Filter", category: "consumable", icon: Filter, expectedLifespanMonths: 6, serviceIntervalMonths: 6, partnerCategory: "plumbing" },
  { type: "fridge_filter", name: "Fridge Water Filter", category: "consumable", icon: Filter, expectedLifespanMonths: 6, serviceIntervalMonths: 6 },
  { type: "smoke_detector", name: "Smoke Detector", category: "consumable", icon: BellRing, expectedLifespanMonths: 10 * 12, serviceIntervalMonths: 12, description: "Replace battery yearly · unit every 10 yrs" },
  { type: "co_detector", name: "CO Detector", category: "consumable", icon: BellRing, expectedLifespanMonths: 7 * 12, serviceIntervalMonths: 12 },

  // Custom
  { type: "custom", name: "Custom item", category: "custom", icon: Wrench, expectedLifespanMonths: 10 * 12 },
];

export function getPreset(type: string): EquipmentPreset | undefined {
  return EQUIPMENT_PRESETS.find((p) => p.type === type);
}

export interface HealthStatus {
  pctRemaining: number; // 0..100
  monthsSinceInstall: number;
  monthsUntilDue: number | null; // service-cycle based; null if no interval
  tone: "good" | "warn" | "due" | "overdue" | "unknown";
  label: string;
  action: string;
}

export function computeHealth(eq: {
  install_date?: string | null;
  expected_lifespan_months?: number | null;
  service_interval_months?: number | null;
  last_serviced_at?: string | null;
}): HealthStatus {
  const now = new Date();
  const install = eq.install_date ? new Date(eq.install_date) : null;
  const monthsSinceInstall = install ? monthsBetween(install, now) : 0;

  // Service-interval (consumables / annual service)
  if (eq.service_interval_months) {
    const ref = eq.last_serviced_at ? new Date(eq.last_serviced_at) : install ?? now;
    const monthsSince = monthsBetween(ref, now);
    const monthsUntil = eq.service_interval_months - monthsSince;
    const pct = clamp((monthsUntil / eq.service_interval_months) * 100, 0, 100);
    if (monthsUntil < 0) return { pctRemaining: 0, monthsSinceInstall, monthsUntilDue: monthsUntil, tone: "overdue", label: `${Math.abs(Math.round(monthsUntil))} mo overdue`, action: "Service overdue" };
    if (monthsUntil < 1) return { pctRemaining: pct, monthsSinceInstall, monthsUntilDue: monthsUntil, tone: "due", label: "Due now", action: "Book service" };
    if (monthsUntil < 2) return { pctRemaining: pct, monthsSinceInstall, monthsUntilDue: monthsUntil, tone: "warn", label: `Due in ${Math.round(monthsUntil)} mo`, action: "Schedule soon" };
    return { pctRemaining: pct, monthsSinceInstall, monthsUntilDue: monthsUntil, tone: "good", label: `Next service in ${Math.round(monthsUntil)} mo`, action: "On track" };
  }

  // Lifespan-based (systems / appliances)
  if (eq.expected_lifespan_months && install) {
    const remaining = eq.expected_lifespan_months - monthsSinceInstall;
    const pct = clamp((remaining / eq.expected_lifespan_months) * 100, 0, 100);
    const yrs = Math.round(remaining / 12);
    if (remaining <= 0) return { pctRemaining: 0, monthsSinceInstall, monthsUntilDue: null, tone: "overdue", label: "Past expected life", action: "Plan replacement" };
    if (pct < 15) return { pctRemaining: pct, monthsSinceInstall, monthsUntilDue: null, tone: "due", label: `~${yrs} yr left`, action: "Get a quote" };
    if (pct < 30) return { pctRemaining: pct, monthsSinceInstall, monthsUntilDue: null, tone: "warn", label: `~${yrs} yr left`, action: "Start budgeting" };
    return { pctRemaining: pct, monthsSinceInstall, monthsUntilDue: null, tone: "good", label: `~${yrs} yr left`, action: "Healthy" };
  }

  return { pctRemaining: 50, monthsSinceInstall, monthsUntilDue: null, tone: "unknown", label: "Add install date", action: "Update details" };
}

function monthsBetween(a: Date, b: Date): number {
  return (b.getFullYear() - a.getFullYear()) * 12 + (b.getMonth() - a.getMonth()) + (b.getDate() - a.getDate()) / 30;
}
function clamp(n: number, lo: number, hi: number) { return Math.max(lo, Math.min(hi, n)); }

export const TONE_CLASS: Record<HealthStatus["tone"], { bar: string; text: string; bg: string }> = {
  good:     { bar: "bg-success",     text: "text-success",     bg: "bg-success/10" },
  warn:     { bar: "bg-warning",     text: "text-warning",     bg: "bg-warning/10" },
  due:      { bar: "bg-orange-500",  text: "text-orange-600",  bg: "bg-orange-500/10" },
  overdue:  { bar: "bg-destructive", text: "text-destructive", bg: "bg-destructive/10" },
  unknown:  { bar: "bg-muted-foreground", text: "text-muted-foreground", bg: "bg-muted" },
};
