import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { nextRunFromCadence, type Cadence } from "@/lib/autopilot";

const cadenceSchema = z.enum([
  "weekly", "monthly", "quarterly", "biannual", "annual",
  "seasonal_winter", "seasonal_summer",
]);

const createSchema = z.object({
  provider_id: z.string().uuid(),
  category: z.string().min(1).max(64),
  cadence: cadenceSchema,
  interval_days: z.number().int().min(1).max(365).optional(),
  notes: z.string().max(1000).optional(),
  first_run_at: z.string().datetime().optional(),
});

export const createAutopilotSchedule = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => createSchema.parse(d))
  .handler(async ({ data, context }) => {
    const sb = context.supabase as any;
    const userId = context.userId;

    const { data: home } = await sb
      .from("homes").select("id").eq("owner_id", userId).limit(1).maybeSingle();

    const next = data.first_run_at
      ? new Date(data.first_run_at)
      : nextRunFromCadence(data.cadence as Cadence);

    const { data: row, error } = await sb
      .from("autopilot_schedules")
      .insert({
        homeowner_id: userId,
        home_id: home?.id ?? null,
        category: data.category,
        preferred_provider_id: data.provider_id,
        cadence: data.cadence,
        next_run_at: next.toISOString(),
        notes: data.notes ?? null,
      })
      .select("id")
      .single();
    if (error) throw new Error(error.message);
    return { id: row.id as string };
  });

export const toggleAutopilotSchedule = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) =>
    z.object({ id: z.string().uuid(), active: z.boolean() }).parse(d),
  )
  .handler(async ({ data, context }) => {
    const sb = context.supabase as any;
    const { error } = await sb
      .from("autopilot_schedules")
      .update({ active: data.active })
      .eq("id", data.id)
      .eq("homeowner_id", context.userId);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const deleteAutopilotSchedule = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => z.object({ id: z.string().uuid() }).parse(d))
  .handler(async ({ data, context }) => {
    const sb = context.supabase as any;
    const { error } = await sb
      .from("autopilot_schedules")
      .delete()
      .eq("id", data.id)
      .eq("homeowner_id", context.userId);
    if (error) throw new Error(error.message);
    return { ok: true };
  });
