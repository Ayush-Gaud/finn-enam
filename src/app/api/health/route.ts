import { NextResponse } from "next/server";
import { z } from "zod";
import { cachedCall, MODELS } from "@/lib/ai/router";
import { prompts } from "@/lib/ai/prompts";
import { hasGemini, hasSupabase, getServerEnv } from "@/lib/env";
import { createServiceClient } from "@/lib/supabase";

const schema = z.object({
  category: z.string(),
  confidence: z.number(),
  reason: z.string(),
});

export async function GET() {
  const sb = createServiceClient();
  let dbOk = false;
  if (sb) {
    const { error } = await sb.from("companies").select("id").limit(1);
    dbOk = !error;
  }

  let gemini: { ok: boolean; cached?: boolean; model?: string; error?: string } = {
    ok: false,
  };

  if (hasGemini()) {
    try {
      const first = await cachedCall({
        task: "classifyFiling",
        model: MODELS.flash,
        input: { health: true, n: 1 },
        userPrompt: prompts.classifyFiling.user(
          "Health check filing",
          "Unaudited financial results for the quarter. Revenue and PAT disclosed.",
        ),
        schema,
      });
      const second = await cachedCall({
        task: "classifyFiling",
        model: MODELS.flash,
        input: { health: true, n: 1 },
        userPrompt: prompts.classifyFiling.user(
          "Health check filing",
          "Unaudited financial results for the quarter. Revenue and PAT disclosed.",
        ),
        schema,
      });
      gemini = {
        ok: true,
        cached: second.cached,
        model: first.model,
      };
    } catch (e) {
      gemini = { ok: false, error: e instanceof Error ? e.message : "gemini failed" };
    }
  }

  return NextResponse.json({
    ok: true,
    supabaseConfigured: hasSupabase(),
    supabaseReachable: dbOk,
    geminiConfigured: Boolean(getServerEnv().GEMINI_API_KEY),
    gemini,
    cacheHitProven: gemini.cached === true,
  });
}
