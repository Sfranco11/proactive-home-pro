import { createFileRoute, Navigate, Outlet } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth-context";
import { BottomNav } from "@/components/BottomNav";

export const Route = createFileRoute("/_app")({
  component: AppLayout,
});

function AppLayout() {
  const { session, profile, loading, user } = useAuth();
  const [hasHome, setHasHome] = useState<boolean | null>(null);

  useEffect(() => {
    if (!user || profile?.role === "realtor") {
      setHasHome(true);
      return;
    }
    supabase
      .from("homes")
      .select("id")
      .eq("owner_id", user.id)
      .limit(1)
      .then(({ data }) => setHasHome(!!data && data.length > 0));
  }, [user, profile?.role]);

  if (loading || (session && (profile === null || hasHome === null))) {
    return <div className="grid min-h-screen place-items-center text-muted-foreground">Loading…</div>;
  }
  if (!session) return <Navigate to="/auth" />;
  if (profile?.role === "homeowner" && !hasHome) return <Navigate to="/onboarding" />;

  return (
    <div className="min-h-screen bg-background pb-24">
      <Outlet />
      <BottomNav />
    </div>
  );
}
