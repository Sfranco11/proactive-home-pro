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
  price: z.number().nonnegative().nullable().optional(),
  message: z.string().max(1000).optional(),
});

export const Route = createFileRoute("/api/public/bookings/$token")({
  server: {
    handlers: {
      GET: async ({ params }) => {
        const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
        const { data } = await (supabaseAdmin as any)
          .from("bookings")
          .select(
            "id, status, category, is_recurring, scheduled_at, final_cost, notes, created_at, provider_id",
          )
          .eq("public_token", params.token)
          .maybeSingle();
        if (!data) return new Response("Not found", { status: 404 });

        const { data: provider } = await (supabaseAdmin as any)
          .from("service_providers")
          .select("name, category")
          .eq("id", data.provider_id)
          .maybeSingle();

        const { data: events } = await (supabaseAdmin as any)
          .from("booking_events")
          .select("event_type, payload, created_at")
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
          .eq("public_token", params.token)
          .maybeSingle();
        if (!booking) return new Response("Not found", { status: 404 });

        const patch: Record<string, unknown> = {};
        if (parsed.data.status) patch.status = parsed.data.status;
        if (parsed.data.price !== undefined) patch.final_cost = parsed.data.price;

        if (Object.keys(patch).length) {
          const { error } = await sb.from("bookings").update(patch).eq("id", booking.id);
          if (error) return Response.json({ error: error.message }, { status: 500 });
        }

        if (parsed.data.status) {
          await sb.from("booking_events").insert({
            booking_id: booking.id,
            event_type: `status:${parsed.data.status}`,
            payload: { source: "pro_link" },
          });
        }

        return Response.json({ ok: true });
      },
    },
  },
});
