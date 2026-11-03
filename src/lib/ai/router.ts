import { createHash } from "crypto";
import { GoogleGenerativeAI } from "@google/generative-ai";
import { z } from "zod";
import { createServiceClient } from "@/lib/supabase";
import { getServerEnv } from "@/lib/env";
import { PROMPT_VERSION, prompts, type PromptTask } from "@/lib/ai/prompts";

/** Swappable model ids — change here only. */
export const MODELS = {
  flash: "gemini-2.0-flash",
  pro: "gemini-2.0-pro",
  embed: "text-embedding-004",
} as const;

export type ModelKind = keyof typeof MODELS;

const FLASH_TASKS: PromptTask[] = [
  "classifyFiling",
  "extractResultsNumbers",
  "bioEnrichment",
  "businessFinancialSnapshot",
];

const PRO_TASKS: PromptTask[] = ["bullVsBear", "promisedVsDelivered"];

function getGenAI() {
  const key = getServerEnv().GEMINI_API_KEY;
  if (!key) throw new Error("GEMINI_API_KEY missing");
  return new GoogleGenerativeAI(key);
}

export function hashInput(input: unknown): string {
  return createHash("sha256").update(JSON.stringify(input)).digest("hex");
}

export function cacheKey(model: string, inputHash: string): string {
  return createHash("sha256")
    .update(`${model}|${PROMPT_VERSION}|${inputHash}`)
    .digest("hex");
}

export async function embed(texts: string[]): Promise<number[][]> {
  const genAI = getGenAI();
  const model = genAI.getGenerativeModel({ model: MODELS.embed });
  const out: number[][] = [];
  for (const text of texts) {
    const res = await model.embedContent(text.slice(0, 8000));
    out.push(res.embedding.values);
  }
  return out;
}

function pickModelForTask(task: PromptTask): string {
  if (PRO_TASKS.includes(task)) return MODELS.pro;
  if (FLASH_TASKS.includes(task)) return MODELS.flash;
  return MODELS.flash;
}

async function readCache(key: string): Promise<{ model: string; response: unknown } | null> {
  const sb = createServiceClient();
  if (!sb) return null;
  const { data } = await sb.from("llm_cache").select("model,response").eq("cache_key", key).maybeSingle();
  if (!data) return null;
  return { model: data.model, response: data.response };
}

async function writeCache(key: string, model: string, response: unknown): Promise<void> {
  const sb = createServiceClient();
  if (!sb) return;
  await sb.from("llm_cache").upsert({
    cache_key: key,
    model,
    response: response as object,
  });
}

function extractJson(text: string): unknown {
  const match = text.match(/\{[\s\S]*\}|\[[\s\S]*\]/);
  if (!match) throw new Error("Model returned non-JSON");
  return JSON.parse(match[0]);
}

export type CachedCallResult<T> = {
  data: T;
  cached: boolean;
  model: string;
  cacheKey: string;
};

/**
 * All Gemini access goes through here.
 * Cache key = sha256(model + PROMPT_VERSION + inputHash)
 */
export async function cachedCall<T>(opts: {
  task: PromptTask;
  model?: string;
  input: unknown;
  userPrompt: string;
  schema: z.ZodType<T>;
}): Promise<CachedCallResult<T>> {
  const model = opts.model ?? pickModelForTask(opts.task);
  const inputHash = hashInput(opts.input);
  const key = cacheKey(model, inputHash);

  const hit = await readCache(key);
  if (hit) {
    const parsed = opts.schema.safeParse(hit.response);
    if (parsed.success) {
      return { data: parsed.data, cached: true, model: hit.model, cacheKey: key };
    }
  }

  const promptDef = prompts[opts.task];
  const genAI = getGenAI();
  const generative = genAI.getGenerativeModel({ model });
  const result = await generative.generateContent({
    contents: [
      {
        role: "user",
        parts: [{ text: `${promptDef.system}\n\n${opts.userPrompt}` }],
      },
    ],
  });
  const text = result.response.text();
  const json = extractJson(text);
  const parsed = opts.schema.parse(json);
  await writeCache(key, model, parsed);
  return { data: parsed, cached: false, model, cacheKey: key };
}

/** Deterministic fallback when Gemini is unavailable — still returns valid shapes. */
export function offlineClassify(title: string, raw: string): { category: string; confidence: number; reason: string } {
  const t = `${title}\n${raw}`.toLowerCase();
  const rules: Array<[string, RegExp]> = [
    ["results", /financial results|unaudited|revenue|pat\b|ebitda/],
    ["management_change", /chief financial|cfo|appointment of|resign|kmp/],
    ["M&A", /acquisition|merger|demerger|subsidiary stake/],
    ["dividend", /dividend/],
    ["fund_raise", /commercial paper|ncd|qip|rights issue|preferential/],
    ["litigation", /form 483|litigation|regulatory|fine|order/],
    ["capex", /capacity expansion|capex|capital expenditure/],
    ["credit_rating", /credit rating|reaffirm/],
    ["earnings_call", /conference call|earnings call|transcript/],
    ["investor_meetings", /investor meet|analyst meet/],
    ["agm_egm", /\bagm\b|\begm\b|annual general/],
    ["pledging", /pledge/],
    ["insider_trading", /promoter.*(sold|bought)|insider/],
    ["unclassified", /esop|compliance certificate|brsr|secretarial auditor/],
  ];
  for (const [category, re] of rules) {
    if (re.test(t)) return { category, confidence: 0.7, reason: `heuristic:${category}` };
  }
  return { category: "press_release", confidence: 0.4, reason: "heuristic:default" };
}
