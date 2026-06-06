import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

const createSchema = z.object({
  provider_id: z.string().uuid(),
  category: z.string().min(1).max(64),
  service_type: z.enum(["one_time", "recurring", "seasonal"]).default("one_time"),
  scheduled_at: z.string().datetime().optional(),
  price: z.number().nonnegative().optional(),
  notes: z.string().max(2000).optional(),
});

export const createBooking = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => createSchema.parse(d))
  .handler(async ({ data, context }) => {
    const sb = context.supabase as any;
    const userId = context.userId;

    const { data: home } = await sb
      .from("homes")
      .select("realtor_id")
      .eq("owner_id", userId)
      .limit(1)
      .maybeSingle();
    const realtor_id: string | null = home?.realtor_id ?? null;

    let commission_rate = 10;
    if (realtor_id) {
      const { data: rate } = await sb
        .from("realtor_commission_rates")
        .select("rate")
        .eq("realtor_id", realtor_id)
        .eq("provider_id", data.provider_id)
        .maybeSingle();
      if (rate?.rate != null) commission_rate = Number(rate.rate);
    }

    const { data: row, error } = await sb
      .from("bookings")
      .insert({
        homeowner_id: userId,
        provider_id: data.provider_id,
        realtor_id,
        category: data.category,
        service_type: data.service_type,
        scheduled_at: data.scheduled_at ?? null,
        price: data.price ?? null,
        notes: data.notes ?? null,
        commission_rate,
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
      .eq("homeowner_id", context.userId);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const setBookingPrice = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) =>
    z.object({
      id: z.string().uuid(),
      price: z.number().nonnegative().nullable(),
      commission_rate: z.number().min(0).max(100).optional(),
      commission_status: z.enum(["pending", "paid", "waived"]).optional(),
    }).parse(d),
  )
  .handler(async ({ data, context }) => {
    const sb = context.supabase as any;
    const patch: Record<string, unknown> = { price: data.price };
    if (data.commission_rate != null) patch.commission_rate = data.commission_rate;
    if (data.commission_status) patch.commission_status = data.commission_status;
    const { error } = await sb
      .from("bookings")
      .update(patch)
      .eq("id", data.id)
      .eq("realtor_id", context.userId);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const setProviderCommission = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) =>
    z.object({
      provider_id: z.string().uuid(),
      rate: z.number().min(0).max(100),
    }).parse(d),
  )
  .handler(async ({ data, context }) => {
    const sb = context.supabase as any;
    const { error } = await sb
      .from("realtor_commission_rates")
      .upsert(
        { realtor_id: context.userId, provider_id: data.provider_id, rate: data.rate },
        { onConflict: "realtor_id,provider_id" },
      );
    if (error) throw new Error(error.message);
    return { ok: true };
  });
