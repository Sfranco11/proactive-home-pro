import { createFileRoute } from "@tanstack/react-router";
import { nextRunFromCadence, type Cadence } from "@/lib/autopilot";

/**
 * Cron-triggered: scans due AutoPilot schedules, drafts a 'requested' booking
 * with their preferred provider, and advances next_run_at.
 * Homeowner approves/edits via the standard booking flow.
 */
export const Route = createFileRoute("/api/public/hooks/autopilot-draft")({
  server: {
    handlers: {
      POST: async () => {
        const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
        const sb = supabaseAdmin as any;
        const nowIso = new Date().toISOString();

        const { data: due, error } = await sb
          .from("autopilot_schedules")
          .select("id, owner_id, home_id, category, title, cadence, preferred_partner_id, notes")
          .eq("active", true)
          .lte("next_run_at", nowIso)
          .limit(100);
        if (error) return Response.json({ error: error.message }, { status: 500 });

        let created = 0;
        for (const s of due ?? []) {
          if (!s.preferred_partner_id) continue;
          const { data: home } = await sb
            .from("homes").select("realtor_id").eq("id", s.home_id).maybeSingle();
          const scheduled = new Date();
          scheduled.setDate(scheduled.getDate() + 3);

          await sb.from("bookings").insert({
            owner_id: s.owner_id,
            home_id: s.home_id,
            provider_id: s.preferred_partner_id,
            realtor_id: home?.realtor_id ?? null,
            category: s.category,
            title: s.title ?? `AutoPilot · ${s.category}`,
            is_recurring: true,
            status: "requested",
            scheduled_at: scheduled.toISOString(),
            notes: s.notes,
            autopilot_schedule_id: s.id,
          });

          const next = nextRunFromCadence(s.cadence as Cadence);
          await sb
            .from("autopilot_schedules")
            .update({ last_run_at: nowIso, next_run_at: next.toISOString() })
            .eq("id", s.id);
          created++;
        }
        return Response.json({ ok: true, created });
      },
    },
  },
});
