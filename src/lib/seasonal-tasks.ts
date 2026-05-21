export type Season = "spring" | "summer" | "fall" | "winter";

export interface SeasonalTask {
  key: string;
  title: string;
  category: string;
  diy: boolean;
  estCost: string;
  description: string;
  steps: string[];
  callPro?: string; // partner category key
}

export const SEASONS: { key: Season; label: string; months: string; tint: string }[] = [
  { key: "spring", label: "Spring", months: "Mar – May", tint: "bg-spring/15 text-spring" },
  { key: "summer", label: "Summer", months: "Jun – Aug", tint: "bg-summer/15 text-summer" },
  { key: "fall", label: "Fall", months: "Sep – Nov", tint: "bg-fall/15 text-fall" },
  { key: "winter", label: "Winter", months: "Dec – Feb", tint: "bg-winter/15 text-winter" },
];

export const SEASONAL_TASKS: Record<Season, SeasonalTask[]> = {
  spring: [
    {
      key: "spring-gutters",
      title: "Clean gutters & downspouts",
      category: "Exterior",
      diy: true,
      estCost: "$0 DIY · $150–$300 pro",
      description: "Clear winter debris so spring rains drain away from your foundation.",
      steps: [
        "Set ladder on level ground; have a spotter if possible.",
        "Scoop debris into a bucket; flush with a garden hose.",
        "Confirm downspouts discharge 4–6 ft from the foundation.",
        "Look for sagging brackets or rust streaks.",
      ],
      callPro: "general",
    },
    {
      key: "spring-hvac",
      title: "AC pre-season inspection",
      category: "HVAC",
      diy: false,
      estCost: "$80–$200",
      description: "Pro tune-up catches refrigerant and capacitor issues before peak heat.",
      steps: [
        "Replace filter (1–3\" thick).",
        "Hose down outdoor condenser fins gently.",
        "Schedule a licensed HVAC tune-up.",
      ],
      callPro: "hvac",
    },
    {
      key: "spring-pressure-wash",
      title: "Pressure wash exterior surfaces",
      category: "Exterior",
      diy: true,
      estCost: "$0–$400",
      description: "Removes mildew and pollen from siding, walks, and deck.",
      steps: [
        "Use 25° tip on siding, hold 12+ inches away.",
        "Work top-down so runoff doesn't streak.",
        "Avoid spraying upward into siding seams.",
      ],
    },
    {
      key: "spring-landscape",
      title: "Landscape & grading check",
      category: "Yard",
      diy: true,
      estCost: "$0–$150",
      description: "Confirm soil slopes away from the house at least 6\" over 10 ft.",
      steps: [
        "Walk the perimeter after rain — note puddles.",
        "Top up low spots with soil (not mulch).",
        "Trim shrubs back 12\" from siding.",
      ],
    },
  ],
  summer: [
    {
      key: "summer-ac-filter",
      title: "Change AC filter monthly",
      category: "HVAC",
      diy: true,
      estCost: "$10–$25",
      description: "A clogged filter is the #1 cause of summer AC failures.",
      steps: [
        "Note the size printed on the old filter.",
        "Slide new filter in with the airflow arrow toward the unit.",
        "Set a phone reminder for 30 days.",
      ],
    },
    {
      key: "summer-deck",
      title: "Deck & patio inspection",
      category: "Exterior",
      diy: true,
      estCost: "$0–$50",
      description: "Catch loose boards, rusted fasteners, and rot before guests arrive.",
      steps: [
        "Probe suspect boards with a screwdriver.",
        "Tighten any lifted screws.",
        "Re-seal every 2–3 years.",
      ],
    },
    {
      key: "summer-pest",
      title: "Quarterly pest perimeter",
      category: "Pest",
      diy: false,
      estCost: "$80–$150",
      description: "Treat the foundation perimeter for ants, spiders, and wasps.",
      steps: [
        "Clear cobwebs from eaves.",
        "Seal gaps around utility penetrations.",
        "Book quarterly pro treatment.",
      ],
      callPro: "pest",
    },
    {
      key: "summer-caulk",
      title: "Refresh exterior caulking",
      category: "Exterior",
      diy: true,
      estCost: "$15–$40",
      description: "Seal gaps around windows, doors, and siding seams.",
      steps: [
        "Remove old cracked caulk with a utility knife.",
        "Wipe clean; apply paintable exterior caulk.",
        "Smooth with a wet finger.",
      ],
    },
  ],
  fall: [
    {
      key: "fall-furnace",
      title: "Furnace inspection & tune-up",
      category: "HVAC",
      diy: false,
      estCost: "$100–$250",
      description: "A pro inspection catches cracked heat exchangers and CO risks.",
      steps: [
        "Replace filter.",
        "Test thermostat in heat mode for 10 minutes.",
        "Book licensed HVAC tune-up.",
      ],
      callPro: "hvac",
    },
    {
      key: "fall-weatherstrip",
      title: "Weatherstripping & door sweeps",
      category: "Envelope",
      diy: true,
      estCost: "$15–$60",
      description: "Stops drafts and cuts heating bills 5–10%.",
      steps: [
        "Hold a candle near edges to find drafts.",
        "Replace compressed foam seals.",
        "Add door sweeps to exterior doors.",
      ],
    },
    {
      key: "fall-gutters",
      title: "Final gutter clearing",
      category: "Exterior",
      diy: true,
      estCost: "$0 DIY · $150–$300 pro",
      description: "Clear leaves after they've dropped to prevent ice dams.",
      steps: [
        "Wait until 90% of leaves are down.",
        "Flush with hose to confirm flow.",
        "Inspect for sagging spikes.",
      ],
      callPro: "general",
    },
    {
      key: "fall-winterize",
      title: "Winterize exterior plumbing",
      category: "Plumbing",
      diy: true,
      estCost: "$0–$20",
      description: "Disconnect hoses and drain hose bibs to prevent burst pipes.",
      steps: [
        "Disconnect & store garden hoses.",
        "Shut off interior valve to outdoor spigots.",
        "Open exterior spigot to drain.",
      ],
    },
  ],
  winter: [
    {
      key: "winter-pipes",
      title: "Pipe freeze prevention",
      category: "Plumbing",
      diy: true,
      estCost: "$0–$30",
      description: "Below 20°F, drip faucets on exterior walls.",
      steps: [
        "Open cabinet doors under sinks on exterior walls.",
        "Drip cold water from the highest faucet.",
        "Know where your water main shutoff is.",
      ],
      callPro: "plumbing",
    },
    {
      key: "winter-roof",
      title: "Roof & snow load check",
      category: "Roofing",
      diy: false,
      estCost: "$0–$300",
      description: "Heavy snow + ice dams stress shingles and decking.",
      steps: [
        "Look for icicle dams along eaves.",
        "Use a roof rake from the ground only.",
        "Call a pro if you see sagging or active leaks.",
      ],
      callPro: "roofing",
    },
    {
      key: "winter-emergency",
      title: "Emergency preparedness check",
      category: "Safety",
      diy: true,
      estCost: "$0–$50",
      description: "Test detectors and stock essentials before storm season.",
      steps: [
        "Test smoke & CO detectors; replace batteries.",
        "Stock flashlights, water (1 gal/person/day), blankets.",
        "Save shutoff locations to your phone.",
      ],
    },
    {
      key: "winter-weatherproof",
      title: "Weatherproof exposed areas",
      category: "Envelope",
      diy: true,
      estCost: "$20–$80",
      description: "Plastic-film exterior windows in unused rooms and insulate the attic hatch.",
      steps: [
        "Install plastic film kits over leaky windows.",
        "Add weatherstrip foam around attic access.",
        "Reverse ceiling fans to clockwise (low speed).",
      ],
    },
  ],
};

export function currentSeason(date = new Date()): Season {
  const m = date.getMonth();
  if (m >= 2 && m <= 4) return "spring";
  if (m >= 5 && m <= 7) return "summer";
  if (m >= 8 && m <= 10) return "fall";
  return "winter";
}
