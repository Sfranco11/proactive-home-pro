import { Link, useLocation } from "@tanstack/react-router";
import {
  LogOut,
  Menu,
  Home,
  Sparkles,
  Repeat,
  BookCheck,
  AlertTriangle,
  CalendarCheck,
  BookOpen,
  Users,
  LayoutDashboard,
  DollarSign,
  ClipboardList,
  Crown,
} from "lucide-react";
import { useState } from "react";
import { useAuth } from "@/lib/auth-context";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
  SheetClose,
} from "@/components/ui/sheet";
import logoMark from "@/assets/logo-mark.png.asset.json";

const homeownerMenu = [
  { to: "/home", label: "Home", icon: Home },
  { to: "/calendar", label: "Seasonal calendar", icon: CalendarCheck },
  { to: "/triage", label: "Something broke", icon: AlertTriangle },
  { to: "/pros", label: "Find a pro", icon: Sparkles },
  { to: "/bookings", label: "My bookings", icon: BookCheck },
  { to: "/autopilot", label: "AutoPilot", icon: Repeat },
  { to: "/systems", label: "Systems guide", icon: BookOpen },
  { to: "/partners", label: "Trusted partners", icon: Users },
  { to: "/logs", label: "Maintenance log", icon: ClipboardList },
  { to: "/upgrade", label: "Upgrade to Premium", icon: Crown },
];

const realtorMenu = [
  { to: "/realtor", label: "Dashboard", icon: LayoutDashboard },
  { to: "/realtor/revenue", label: "Revenue & payouts", icon: DollarSign },
];

export function AppHeader({ title, subtitle }: { title: string; subtitle?: string }) {
  const { signOut, profile } = useAuth();
  const loc = useLocation();
  const [open, setOpen] = useState(false);
  const items = profile?.role === "realtor" ? realtorMenu : homeownerMenu;
  const homeHref = profile?.role === "realtor" ? "/realtor" : "/home";

  return (
    <header className="sticky top-0 z-30 border-b border-border bg-background/85 backdrop-blur">
      <div className="container-app flex items-center justify-between py-3">
        <Link to={homeHref} className="flex items-center gap-2 min-w-0">
          <img
            src={logoMark.url}
            alt="HomeOwner Pro"
            width={32}
            height={32}
            className="h-8 w-8 shrink-0 object-contain"
          />
          <div className="leading-tight min-w-0">
            <div className="truncate font-display text-sm font-semibold">{title}</div>
            {subtitle && (
              <div className="truncate text-[11px] text-muted-foreground">{subtitle}</div>
            )}
          </div>
        </Link>

        <Sheet open={open} onOpenChange={setOpen}>
          <SheetTrigger asChild>
            <Button variant="ghost" size="icon" aria-label="Open menu">
              <Menu className="h-5 w-5" />
            </Button>
          </SheetTrigger>
          <SheetContent side="right" className="w-[300px] sm:w-[340px] p-0">
            <SheetHeader className="border-b border-border bg-hero text-primary-foreground p-5">
              <div className="flex items-center gap-3">
                <img
                  src={logoMark.url}
                  alt=""
                  width={36}
                  height={36}
                  className="h-9 w-9 object-contain [filter:brightness(0)_invert(1)]"
                />
                <div className="text-left">
                  <SheetTitle className="font-display text-base text-primary-foreground">
                    HomeOwner Pro
                  </SheetTitle>
                  <p className="text-[11px] text-primary-foreground/75">
                    {profile?.full_name ?? "Signed in"}
                  </p>
                </div>
              </div>
            </SheetHeader>
            <nav className="flex flex-col p-2">
              {items.map((it) => {
                const active =
                  loc.pathname === it.to || loc.pathname.startsWith(it.to + "/");
                const Icon = it.icon;
                return (
                  <SheetClose asChild key={it.to}>
                    <Link
                      to={it.to}
                      className={`flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm transition-colors ${
                        active
                          ? "bg-primary/10 text-primary font-medium"
                          : "text-foreground hover:bg-accent"
                      }`}
                    >
                      <Icon className="h-4 w-4" />
                      {it.label}
                    </Link>
                  </SheetClose>
                );
              })}
            </nav>
            <div className="mt-auto border-t border-border p-3">
              <Button
                variant="ghost"
                className="w-full justify-start"
                onClick={() => {
                  setOpen(false);
                  signOut();
                }}
              >
                <LogOut className="mr-2 h-4 w-4" /> Sign out
              </Button>
              <p className="mt-2 text-center text-[10px] text-muted-foreground">
                © {new Date().getFullYear()} HomeOwner Pro
              </p>
            </div>
          </SheetContent>
        </Sheet>
      </div>
    </header>
  );
}
