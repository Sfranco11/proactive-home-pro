import { Link, useLocation } from "@tanstack/react-router";
import { Home, AlertTriangle, Sparkles, LayoutDashboard, BookCheck, DollarSign, Repeat, Gift } from "lucide-react";
import { useAuth } from "@/lib/auth-context";

const homeownerItems = [
  { to: "/home", label: "Home", icon: Home },
  { to: "/pros", label: "Pros", icon: Sparkles },
  { to: "/autopilot", label: "AutoPilot", icon: Repeat },
  { to: "/bookings", label: "Bookings", icon: BookCheck },
  { to: "/triage", label: "Help", icon: AlertTriangle },
];

const realtorItems = [
  { to: "/realtor", label: "Dashboard", icon: LayoutDashboard },
  { to: "/realtor/revenue", label: "Revenue", icon: DollarSign },
  { to: "/realtor/bounties", label: "Bounties", icon: Gift },
];

export function BottomNav() {
  const { profile } = useAuth();
  const loc = useLocation();
  const items = profile?.role === "realtor" ? realtorItems : homeownerItems;

  return (
    <nav className="fixed bottom-0 inset-x-0 z-40 border-t border-border bg-card/95 backdrop-blur supports-[backdrop-filter]:bg-card/80">
      <div className="container-app flex justify-between gap-1 py-2">
        {items.map((it) => {
          const active = loc.pathname === it.to || loc.pathname.startsWith(it.to + "/");
          const Icon = it.icon;
          return (
            <Link
              key={it.to}
              to={it.to}
              className={`flex flex-1 flex-col items-center gap-1 rounded-xl px-2 py-1.5 text-[10px] font-medium transition-colors ${
                active ? "text-primary" : "text-muted-foreground hover:text-foreground"
              }`}
            >
              <Icon className={`h-5 w-5 ${active ? "stroke-[2.5]" : ""}`} />
              <span>{it.label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
