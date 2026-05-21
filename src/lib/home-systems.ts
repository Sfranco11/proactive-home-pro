import { Droplets, Zap, Flame, Wind, Home as HomeIcon, ShieldAlert } from "lucide-react";

export interface SystemInfo {
  key: string;
  name: string;
  icon: typeof Droplets;
  shutoff: string;
  lifespan: string;
  warnings: string[];
  partnerCategory: string;
}

export const HOME_SYSTEMS: SystemInfo[] = [
  {
    key: "water",
    name: "Water & Plumbing",
    icon: Droplets,
    shutoff:
      "Main water shutoff is typically near where the supply line enters the home — basement, crawlspace, or an exterior box near the meter. Turn clockwise to close.",
    lifespan: "Water heater: 8–12 yrs · Supply lines: 50+ yrs (copper/PEX) · Faucets: 15–20 yrs",
    warnings: [
      "Damp spots on ceilings or walls",
      "Sudden drop in water pressure",
      "Rumbling or popping from water heater",
      "Sewer-gas odor from drains",
    ],
    partnerCategory: "plumbing",
  },
  {
    key: "electrical",
    name: "Electrical",
    icon: Zap,
    shutoff:
      "Breaker panel is usually in the garage, basement, or utility closet. The main breaker is at the top — flip to OFF to kill all power.",
    lifespan: "Panel: 25–40 yrs · Outlets/switches: 15–25 yrs · GFCIs: 10–15 yrs",
    warnings: [
      "Outlets warm to the touch",
      "Frequent breaker trips on one circuit",
      "Buzzing or crackling from switches",
      "Burning plastic smell",
    ],
    partnerCategory: "electrical",
  },
  {
    key: "gas",
    name: "Natural Gas",
    icon: Flame,
    shutoff:
      "Main gas valve is at the meter outside. Use a wrench to turn the lever 1/4 turn so it's perpendicular to the pipe. If you smell gas, leave first — call from outside.",
    lifespan: "Gas lines: 50+ yrs · Furnace: 15–25 yrs · Water heater: 8–12 yrs",
    warnings: [
      "Rotten-egg odor (mercaptan)",
      "Hissing sound near appliances",
      "Pilot light won't stay lit",
      "Dead vegetation near gas lines",
    ],
    partnerCategory: "hvac",
  },
  {
    key: "hvac",
    name: "HVAC",
    icon: Wind,
    shutoff:
      "Disconnect: outdoor unit has a pull-out disconnect box on the wall beside it. Indoor air handler has a switch nearby that looks like a light switch.",
    lifespan: "AC condenser: 12–17 yrs · Furnace: 15–25 yrs · Heat pump: 10–15 yrs",
    warnings: [
      "Ice on refrigerant lines in summer",
      "Short cycling (on/off rapidly)",
      "Weak airflow at vents",
      "Sudden spike in utility bill",
    ],
    partnerCategory: "hvac",
  },
  {
    key: "roof",
    name: "Roof & Envelope",
    icon: HomeIcon,
    shutoff: "No shutoff — but know the location of attic access and emergency tarps.",
    lifespan: "Asphalt shingle: 20–30 yrs · Metal: 40–70 yrs · Tile: 50+ yrs · Gutters: 20+ yrs",
    warnings: [
      "Granules collecting in gutters",
      "Curled or missing shingles",
      "Stains on attic decking",
      "Daylight visible from attic",
    ],
    partnerCategory: "roofing",
  },
  {
    key: "safety",
    name: "Safety & Emergency",
    icon: ShieldAlert,
    shutoff:
      "Know your gas, water, and electrical shutoffs. Keep a flashlight near each. Post local emergency numbers on the fridge.",
    lifespan: "Smoke detectors: 10 yrs · CO detectors: 5–7 yrs · Fire extinguishers: check yearly",
    warnings: [
      "Detector chirping = replace battery or unit",
      "Yellow flame on gas appliance (should be blue)",
      "Headaches that go away when you leave the home",
    ],
    partnerCategory: "general",
  },
];

export const PARTNER_CATEGORIES = [
  { key: "plumbing", label: "Plumbing" },
  { key: "hvac", label: "HVAC" },
  { key: "electrical", label: "Electrical" },
  { key: "roofing", label: "Roofing" },
  { key: "pest", label: "Pest Control" },
  { key: "general", label: "General Contractor / Handyman" },
];

export const TRIAGE_ISSUES = [
  { key: "leak", label: "Active water leak", category: "plumbing", severity: "urgent" as const },
  { key: "no-water", label: "No water at all", category: "plumbing", severity: "urgent" as const },
  { key: "slow-drain", label: "Slow or clogged drain", category: "plumbing", severity: "soon" as const },
  { key: "no-heat", label: "No heat", category: "hvac", severity: "urgent" as const },
  { key: "no-cool", label: "No cooling", category: "hvac", severity: "soon" as const },
  { key: "weak-airflow", label: "Weak airflow from vents", category: "hvac", severity: "non_critical" as const },
  { key: "no-power", label: "Whole-house no power", category: "electrical", severity: "urgent" as const },
  { key: "breaker-trip", label: "Breaker keeps tripping", category: "electrical", severity: "soon" as const },
  { key: "outlet-dead", label: "Single outlet dead", category: "electrical", severity: "non_critical" as const },
  { key: "roof-leak", label: "Roof leak / water from ceiling", category: "roofing", severity: "urgent" as const },
  { key: "missing-shingle", label: "Missing shingles", category: "roofing", severity: "soon" as const },
  { key: "pests", label: "Pest sighting / infestation", category: "pest", severity: "soon" as const },
  { key: "other", label: "Something else", category: "general", severity: "soon" as const },
];
