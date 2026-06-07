import { Link } from "@tanstack/react-router";
import { LogOut } from "lucide-react";
import { useAuth } from "@/lib/auth-context";
import { Button } from "@/components/ui/button";
import logoMark from "@/assets/logo-mark.png.asset.json";

export function AppHeader({ title, subtitle }: { title: string; subtitle?: string }) {
  const { signOut, profile } = useAuth();
  return (
    <header className="sticky top-0 z-30 border-b border-border bg-background/85 backdrop-blur">
      <div className="container-app flex items-center justify-between py-3">
        <Link to="/home" className="flex items-center gap-2">
          <img
            src={logoMark.url}
            alt="HomeOwner Pro"
            width={32}
            height={32}
            loading="lazy"
            className="h-8 w-8 object-contain"
          />
          <div className="leading-tight">
            <div className="font-display text-sm font-semibold">{title}</div>
            {subtitle && <div className="text-[11px] text-muted-foreground">{subtitle}</div>}
          </div>
        </Link>
        <div className="flex items-center gap-2">
          <span className="hidden text-xs text-muted-foreground sm:inline">{profile?.full_name}</span>
          <Button variant="ghost" size="icon" onClick={() => signOut()} aria-label="Sign out">
            <LogOut className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </header>
  );
}
