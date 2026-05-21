import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { ChevronDown } from "lucide-react";
import { AppHeader } from "@/components/AppHeader";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { HOME_SYSTEMS } from "@/lib/home-systems";

export const Route = createFileRoute("/_app/systems")({
  component: SystemsPage,
});

function SystemsPage() {
  const [openKey, setOpenKey] = useState<string | null>(HOME_SYSTEMS[0].key);

  return (
    <>
      <AppHeader title="Systems reference" subtitle="Shutoffs · lifespans · warnings" />
      <main className="container-app py-6 space-y-3">
        {HOME_SYSTEMS.map((sys) => {
          const Icon = sys.icon;
          const open = openKey === sys.key;
          return (
            <Collapsible
              key={sys.key}
              open={open}
              onOpenChange={(v) => setOpenKey(v ? sys.key : null)}
              className="rounded-2xl border border-border bg-card shadow-soft"
            >
              <CollapsibleTrigger className="flex w-full items-center gap-3 p-4 text-left">
                <div className="grid h-11 w-11 place-items-center rounded-xl bg-primary/10 text-primary">
                  <Icon className="h-5 w-5" />
                </div>
                <div className="flex-1">
                  <div className="font-display font-semibold">{sys.name}</div>
                  <div className="text-[11px] text-muted-foreground">Tap to expand</div>
                </div>
                <ChevronDown className={`h-4 w-4 text-muted-foreground transition-transform ${open ? "rotate-180" : ""}`} />
              </CollapsibleTrigger>
              <CollapsibleContent className="space-y-4 border-t border-border px-4 pb-4 pt-4">
                <div>
                  <div className="mb-1 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                    Where to shut it off
                  </div>
                  <p className="text-sm">{sys.shutoff}</p>
                </div>
                <div>
                  <div className="mb-1 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                    Expected lifespan
                  </div>
                  <p className="text-sm">{sys.lifespan}</p>
                </div>
                <div>
                  <div className="mb-1 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                    Warning signs
                  </div>
                  <ul className="space-y-1 text-sm">
                    {sys.warnings.map((w) => (
                      <li key={w} className="flex gap-2">
                        <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-warning" />
                        {w}
                      </li>
                    ))}
                  </ul>
                </div>
              </CollapsibleContent>
            </Collapsible>
          );
        })}
      </main>
    </>
  );
}
