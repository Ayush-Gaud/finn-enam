import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { createServiceClient } from "@/lib/supabase";
import { materialityForCategory, materialityRank, isRoutine } from "@/lib/materiality";
import { offlineClassify, cachedCall, MODELS } from "@/lib/ai/router";
import { prompts } from "@/lib/ai/prompts";
import { parseResultsFromRaw, qoqYoy } from "@/lib/finance";
import { hasGemini } from "@/lib/env";

const classifySchema = z.object({
  category: z.string(),
  confidence: z.number(),
  reason: z.string(),
});

const extractSchema = z.object({
  period: z.string(),
  unit: z.string(),
  latest: z.object({
    revenue: z.number().nullable(),
    ebitda: z.number().nullable(),
    pbt: z.number().nullable(),
    pat: z.number().nullable(),
  }),
  previous: z.object({
    revenue: z.number().nullable(),
    ebitda: z.number().nullable(),
    pbt: z.number().nullable(),
    pat: z.number().nullable(),
  }),
  yearAgo: z.object({
    revenue: z.number().nullable(),
    ebitda: z.number().nullable(),
    pbt: z.number().nullable(),
    pat: z.number().nullable(),
  }),
});

const bioSchema = z.object({
  personName: z.string(),
  role: z.string(),
  action: z.enum(["joined", "resigned", "retired"]),
  bio: z.string(),
  externalContext: z.boolean(),
});

function windowHours(param: string | null): number {
  if (param === "7d") return 168;
  if (param === "30d") return 720;
  return 24;
}

export async function GET(req: NextRequest) {
  const sb = createServiceClient();
  if (!sb) return NextResponse.json({ error: "Supabase not configured" }, { status: 503 });

  const hours = windowHours(req.nextUrl.searchParams.get("window"));
  const settings = await sb.from("user_settings").select("*").eq("id", 1).maybeSingle();
  const muted: string[] = settings.data?.muted_categories ?? [];
  const cutoff = new Date(Date.now() - hours * 3600 * 1000).toISOString();

  const { data: rows, error } = await sb
    .from("filings")
    .select("*, companies(ticker,name)")
    .gte("filed_at", cutoff)
    .order("filed_at", { ascending: false });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  const material: unknown[] = [];
  const routine: unknown[] = [];

  for (const row of rows ?? []) {
    let category = row.category;
    let materiality = row.materiality as "high" | "medium" | "low";

    if (!category || category === "unknown") {
      if (hasGemini()) {
        try {
          const c = await cachedCall({
            task: "classifyFiling",
            model: MODELS.flash,
            input: { filingId: row.id, title: row.title },
            userPrompt: prompts.classifyFiling.user(row.title, row.raw_text ?? row.summary),
            schema: classifySchema,
          });
          category = c.data.category;
        } catch {
          category = offlineClassify(row.title, row.raw_text ?? "").category;
        }
      } else {
        category = offlineClassify(row.title, row.raw_text ?? "").category;
      }
      materiality = materialityForCategory(category);
      await sb.from("filings").update({ category, materiality }).eq("id", row.id);
    }

    if (muted.includes(category)) continue;

    const company = row.companies as { ticker: string; name: string } | null;
    const card: Record<string, unknown> = {
      id: row.id,
      ticker: company?.ticker,
      companyName: company?.name,
      filedAt: row.filed_at,
      title: row.title,
      category,
      materiality,
      summary: row.summary,
      sourceUrl: row.source_url,
      routine: isRoutine(category, materiality),
    };

    if (category === "results" && row.raw_text) {
      let extracted = parseResultsFromRaw(row.raw_text);
      if (hasGemini()) {
        try {
          const r = await cachedCall({
            task: "extractResultsNumbers",
            model: MODELS.flash,
            input: { filingId: row.id, kind: "results" },
            userPrompt: prompts.extractResultsNumbers.user(row.raw_text),
            schema: extractSchema,
          });
          extracted = r.data;
        } catch {
          /* keep parser */
        }
      }
      if (extracted) {
        const { qoq, yoy } = qoqYoy(extracted.latest, extracted.previous, extracted.yearAgo);
        card.enrichment = {
          type: "results",
          period: extracted.period,
          unit: extracted.unit,
          latest: extracted.latest,
          qoq,
          yoy,
        };
      }
    }

    if (category === "management_change" && row.raw_text) {
      let bio: {
        personName: string;
        role: string;
        action: "joined" | "resigned" | "retired";
        bio: string;
        externalContext: boolean;
      } = {
        personName: "Incoming executive",
        role: "KMP",
        action: "joined",
        bio: row.summary,
        externalContext: true,
      };
      if (hasGemini()) {
        try {
          const b = await cachedCall({
            task: "bioEnrichment",
            model: MODELS.flash,
            input: { filingId: row.id, kind: "bio" },
            userPrompt: prompts.bioEnrichment.user(row.raw_text),
            schema: bioSchema,
          });
          bio = b.data;
        } catch {
          /* keep fallback */
        }
      } else {
        const name = row.raw_text.match(/Ms\.\s+([A-Z][a-z]+(?:\s+[A-Z][a-z]+)+)/)?.[1];
        const role = row.raw_text.match(/Chief Financial Officer|CFO|CEO|MD/i)?.[0] ?? "KMP";
        if (name) bio = { ...bio, personName: name, role, bio: row.raw_text.slice(0, 280) };
      }
      card.enrichment = { type: "management_change", ...bio, label: "External context" };
    }

    if (card.routine) routine.push(card);
    else material.push(card);
  }

  material.sort((a, b) => {
    const ma = materialityRank((a as { materiality: "high" | "medium" | "low" }).materiality);
    const mb = materialityRank((b as { materiality: "high" | "medium" | "low" }).materiality);
    return ma - mb;
  });

  return NextResponse.json({
    window: req.nextUrl.searchParams.get("window") ?? "24h",
    windowHours: hours,
    counts: { material: material.length, routine: routine.length },
    material,
    routine,
  });
}
