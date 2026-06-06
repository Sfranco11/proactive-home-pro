import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

const createSchema = z.object({
  provider_id: z.string().uuid(),
  category: z.string().min(1).max(64),
  title: z.string().min(1).max(120).optional(),
  is_recurring: z.boolean().optional(),
  scheduled_at: z.string().datetime().optional(),
  estimated_cost: z.number().nonnegative().optional(),
  notes: z.string().max(2000).optional(),
});

export const createBooking = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => createSchema.parse(d))
  .handler(async ({ data, context }) => {
    const sb = context.supabase as any;
    const userId = context.userId;

    const { data: home, error: homeErr } = await sb
      .from("homes")
      .select("id, realtor_id")
      .eq("owner_id", userId)
      .limit(1)
      .maybeSingle();
    if (homeErr) throw new Error(homeErr.message);
    if (!home?.id) throw new Error("Please add your home first before booking a pro.");

    const { data: provider } = await sb
      .from("service_providers")
      .select("name")
      .eq("id", data.provider_id)
      .maybeSingle();

    const title = data.title ?? `${data.category} · ${provider?.name ?? "Service"}`;

    const { data: row, error } = await sb
      .from("bookings")
      .insert({
        owner_id: userId,
        home_id: home.id,
        realtor_id: home.realtor_id ?? null,
        provider_id: data.provider_id,
        category: data.category,
        title,
        is_recurring: data.is_recurring ?? false,
        scheduled_at: data.scheduled_at ?? null,
        estimated_cost: data.estimated_cost ?? null,
        notes: data.notes ?? null,
        status: "requested",
      })
      .select("id")
      .single();

    if (error) throw new Error(error.message);
    return { id: row.id as string };
  });

export const cancelBooking = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => z.object({ id: z.string().uuid() }).parse(d))
  .handler(async ({ data, context }) => {
    const sb = context.supabase as any;
    const { error } = await sb
      .from("bookings")
      .update({ status: "cancelled" })
      .eq("id", data.id)
      .eq("owner_id", context.userId);
    if (error) throw new Error(error.message);
    return { ok: true };
  });
