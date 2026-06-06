import { createFileRoute } from "@tanstack/react-router";
import { z } from "zod";

const updateSchema = z.object({
  status: z
    .enum([
      "requested",
      "contacted",
      "scheduled",
      "confirmed",
      "on_the_way",
      "arrived",
      "in_progress",
      "completed",
      "cancelled",
    ])
    .optional(),
  eta_minutes: z.number().int().min(0).max(600).nullable().optional(),
  price: z.number().nonnegative().nullable().optional(),
  message: z.string().max(1000).optional(),
  photo_url: z.string().url().max(1000).optional(),
});

export const Route = createFileRoute("/api/public/bookings/$token")({
  server: {
    handlers: {
      GET: async ({ params }) => {
        const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
        const { data } = await (supabaseAdmin as any)
          .from("bookings")
          .select(
            "id, status, category, service_type, scheduled_at, price, eta_minutes, notes, created_at, provider_id",
          )
          .eq("pro_token", params.token)
          .maybeSingle();
        if (!data) return new Response("Not found", { status: 404 });

        const { data: provider } = await (supabaseAdmin as any)
          .from("service_providers")
          .select("name, category")
          .eq("id", data.provider_id)
          .maybeSingle();

        const { data: events } = await (supabaseAdmin as any)
          .from("booking_events")
          .select("kind, status, message, photo_url, created_at")
          .eq("booking_id", data.id)
          .order("created_at", { ascending: true });

        return Response.json({ booking: data, provider, events: events ?? [] });
      },
      POST: async ({ request, params }) => {
        let json: unknown;
        try {
          json = await request.json();
        } catch {
          return new Response("Bad request", { status: 400 });
        }
        const parsed = updateSchema.safeParse(json);
        if (!parsed.success) {
          return Response.json({ error: parsed.error.issues[0].message }, { status: 400 });
        }

        const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
        const sb = supabaseAdmin as any;

        const { data: booking } = await sb
          .from("bookings")
          .select("id")
          .eq("pro_token", params.token)
          .maybeSingle();
        if (!booking) return new Response("Not found", { status: 404 });

        const patch: Record<string, unknown> = {};
        if (parsed.data.status) patch.status = parsed.data.status;
        if (parsed.data.eta_minutes !== undefined) patch.eta_minutes = parsed.data.eta_minutes;
        if (parsed.data.price !== undefined) patch.price = parsed.data.price;

        if (Object.keys(patch).length) {
          const { error } = await sb.from("bookings").update(patch).eq("id", booking.id);
          if (error) return Response.json({ error: error.message }, { status: 500 });
        }

        if (parsed.data.eta_minutes != null && !parsed.data.status) {
          await sb.from("booking_events").insert({
            booking_id: booking.id,
            kind: "eta_update",
            message: `ETA: ${parsed.data.eta_minutes} min`,
          });
        }

        if (parsed.data.photo_url) {
          await sb.from("booking_events").insert({
            booking_id: booking.id,
            kind: "photo",
            photo_url: parsed.data.photo_url,
          });
        }

        if (parsed.data.message) {
          await sb.from("booking_messages").insert({
            booking_id: booking.id,
            sender: "pro",
            body: parsed.data.message,
          });
        }

        return Response.json({ ok: true });
      },
    },
  },
});
