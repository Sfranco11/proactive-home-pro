import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

const upsertSchema = z.object({
  id: z.string().uuid().optional(),
  type: z.string().min(1).max(64),
  category: z.enum(["system", "appliance", "consumable", "custom"]).default("system"),
  name: z.string().min(1).max(120),
  brand: z.string().max(80).optional().nullable(),
  model: z.string().max(120).optional().nullable(),
  install_date: z.string().optional().nullable(),
  expected_lifespan_months: z.number().int().min(1).max(1200).optional().nullable(),
  service_interval_months: z.number().int().min(1).max(120).optional().nullable(),
  last_serviced_at: z.string().optional().nullable(),
  notes: z.string().max(1000).optional().nullable(),
  partner_category: z.string().max(64).optional().nullable(),
});

export const upsertEquipment = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => upsertSchema.parse(d))
  .handler(async ({ data, context }) => {
    const sb = context.supabase as any;
    const userId = context.userId;

    const { data: home } = await sb
      .from("homes").select("id").eq("owner_id", userId).limit(1).maybeSingle();
    if (!home?.id) throw new Error("Add your home first.");

    const payload = {
      owner_id: userId,
      home_id: home.id,
      type: data.type,
      category: data.category,
      name: data.name,
      brand: data.brand || null,
      model: data.model || null,
      install_date: data.install_date || null,
      expected_lifespan_months: data.expected_lifespan_months ?? null,
      service_interval_months: data.service_interval_months ?? null,
      last_serviced_at: data.last_serviced_at || null,
      notes: data.notes || null,
      partner_category: data.partner_category || null,
    };

    if (data.id) {
      const { error } = await sb.from("home_equipment").update(payload).eq("id", data.id).eq("owner_id", userId);
      if (error) throw new Error(error.message);
      return { id: data.id };
    }
    const { data: row, error } = await sb.from("home_equipment").insert(payload).select("id").single();
    if (error) throw new Error(error.message);
    return { id: row.id as string };
  });

export const deleteEquipment = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => z.object({ id: z.string().uuid() }).parse(d))
  .handler(async ({ data, context }) => {
    const sb = context.supabase as any;
    const { error } = await sb.from("home_equipment").delete().eq("id", data.id).eq("owner_id", context.userId);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const markServiced = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => z.object({ id: z.string().uuid() }).parse(d))
  .handler(async ({ data, context }) => {
    const sb = context.supabase as any;
    const today = new Date().toISOString().slice(0, 10);
    const { error } = await sb.from("home_equipment").update({ last_serviced_at: today }).eq("id", data.id).eq("owner_id", context.userId);
    if (error) throw new Error(error.message);
    return { ok: true };
  });
