import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Home as HomeIcon, ArrowRight } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/r/$code")({
  component: InviteLanding,
  head: ({ params }) => ({
    meta: [
      { title: `${params.code} — HomeOwner Pro invite` },
      { name: "description", content: "You've been gifted HomeOwner Pro by your realtor." },
    ],
  }),
});

interface Brand {
  company_name: string;
  brand_color: string;
  logo_url: string | null;
}

function InviteLanding() {
  const { code } = Route.useParams();
  const [brand, setBrand] = useState<Brand | null>(null);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    supabase
      .from("realtors")
      .select("company_name, brand_color, logo_url")
      .eq("referral_code", code.toUpperCase())
      .maybeSingle()
      .then(({ data }) => {
        if (!data) setNotFound(true);
        else setBrand(data as Brand);
      });
  }, [code]);

  return (
    <div className="min-h-screen" style={brand ? { background: `linear-gradient(160deg, ${brand.brand_color} 0%, oklch(0.18 0.04 165) 100%)` } : undefined}>
      <div className={`min-h-screen ${brand ? "text-white" : "bg-background"}`}>
        <div className="container-app flex min-h-screen flex-col justify-center py-12 text-center">
          {brand ? (
            <>
              {brand.logo_url ? (
                <img src={brand.logo_url} alt={brand.company_name} className="mx-auto mb-6 h-16 rounded-xl bg-white/10 object-contain p-2" />
              ) : (
                <div className="mx-auto mb-6 grid h-16 w-16 place-items-center rounded-2xl bg-white/15">
                  <HomeIcon className="h-8 w-8" />
                </div>
              )}
              <p className="text-sm uppercase tracking-widest opacity-80">A gift from</p>
              <h1 className="mt-1 font-display text-3xl font-semibold">{brand.company_name}</h1>
              <p className="mx-auto mt-6 max-w-md text-white/85">
                Welcome home. We've set up HomeOwner Pro so you'll know exactly what to do — and
                who to call — through every season.
              </p>
              <Link
                to="/auth"
                search={{ mode: "homeowner", code: code.toUpperCase() } as any}
                className="mt-10 inline-flex items-center justify-center gap-2 rounded-xl bg-white px-6 py-3 font-medium text-primary shadow-glow"
              >
                Activate your account <ArrowRight className="h-4 w-4" />
              </Link>
              <p className="mt-4 text-xs opacity-75">Invite code: <span className="font-mono">{code.toUpperCase()}</span></p>
            </>
          ) : notFound ? (
            <>
              <h1 className="font-display text-2xl font-semibold">Invite not found</h1>
              <p className="mt-2 text-muted-foreground">Double-check the code with your realtor.</p>
              <Link to="/" className="mt-6 text-sm text-primary underline">Back to home</Link>
            </>
          ) : (
            <p className="text-muted-foreground">Loading…</p>
          )}
        </div>
      </div>
    </div>
  );
}
