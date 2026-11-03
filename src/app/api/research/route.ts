import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { runResearch, type ResearchModule } from "@/lib/research/run";

const schema = z.object({
  ticker: z.string().min(1).max(20),
  module: z.enum(["snapshot", "bull_bear", "promised_delivered"]),
});

export async function GET(req: NextRequest) {
  const parsed = schema.safeParse({
    ticker: req.nextUrl.searchParams.get("ticker"),
    module: req.nextUrl.searchParams.get("module") ?? "snapshot",
  });
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  try {
    const out = await runResearch(parsed.data.ticker, parsed.data.module as ResearchModule);
    return NextResponse.json(out);
  } catch (e) {
    return NextResponse.json({ error: e instanceof Error ? e.message : "research failed" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  const body = schema.safeParse(await req.json());
  if (!body.success) return NextResponse.json({ error: body.error.flatten() }, { status: 400 });
  try {
    const out = await runResearch(body.data.ticker, body.data.module as ResearchModule);
    return NextResponse.json(out);
  } catch (e) {
    return NextResponse.json({ error: e instanceof Error ? e.message : "research failed" }, { status: 500 });
  }
}
