import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { createServiceClient } from "@/lib/supabase";

const patchSchema = z.object({
  vol_multiple: z.number().min(1).max(10).optional(),
  price_pct: z.number().min(0.5).max(20).optional(),
  window_hours: z.number().int().min(1).max(720).optional(),
  muted_categories: z.array(z.string()).optional(),
});

export async function GET() {
  const sb = createServiceClient();
  if (!sb) return NextResponse.json({ error: "Supabase not configured" }, { status: 503 });
  const { data, error } = await sb.from("user_settings").select("*").eq("id", 1).maybeSingle();
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data);
}

export async function PATCH(req: NextRequest) {
  const sb = createServiceClient();
  if (!sb) return NextResponse.json({ error: "Supabase not configured" }, { status: 503 });
  const body = patchSchema.safeParse(await req.json());
  if (!body.success) return NextResponse.json({ error: body.error.flatten() }, { status: 400 });

  const { data, error } = await sb
    .from("user_settings")
    .update({ ...body.data, updated_at: new Date().toISOString() })
    .eq("id", 1)
    .select()
    .maybeSingle();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data);
}
