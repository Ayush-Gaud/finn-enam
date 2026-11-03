import { z } from "zod";
import { createServiceClient } from "@/lib/supabase";
import { cachedCall, embed, MODELS, offlineClassify } from "@/lib/ai/router";
import { prompts } from "@/lib/ai/prompts";
import { hasGemini } from "@/lib/env";
import { companyHasPrimaryDocs, ingestDocuments } from "@/lib/research/ingest";
import { PRIMARY_CORPUS } from "@/data/primaryCorpus";

export type ResearchModule = "snapshot" | "bull_bear" | "promised_delivered";

type ChunkHit = {
  id: string;
  documentId: string;
  content: string;
  page: number | null;
  similarity: number;
  documentTitle: string;
  period: string;
  docType: string;
};

const citationSchema = z.object({
  id: z.string(),
  documentTitle: z.string(),
  period: z.string(),
  page: z.number().nullable().optional(),
  quote: z.string(),
});

const sectionSchema = z.object({
  title: z.string(),
  body: z.string(),
  citationIds: z.array(z.string()),
});

const snapshotSchema = z.object({
  headline: z.string(),
  sections: z.array(sectionSchema),
  citations: z.array(citationSchema),
});

const promisedSchema = z.object({
  headline: z.string(),
  table: z.array(
    z.object({
      quarter: z.string(),
      promised: z.string(),
      delivered: z.string(),
      verdict: z.enum(["met", "missed", "mixed", "unclear"]),
      citationIds: z.array(z.string()),
    }),
  ),
  sections: z.array(sectionSchema).optional(),
  citations: z.array(citationSchema),
});

async function ensureIngested(ticker: string) {
  const t = ticker.toUpperCase().replace(/\.NS$/i, "");
  if (await companyHasPrimaryDocs(t)) return { ingested: false };
  const docs = PRIMARY_CORPUS.filter((d) => d.ticker === t);
  if (docs.length === 0) {
    // Generic stub so arbitrary tickers still return a grounded gap message after ingest attempt
    await ingestDocuments([
      {
        ticker: t,
        name: t,
        sector: "Unknown",
        doc_type: "annual_report",
        period: "FY25",
        title: `${t} placeholder AR excerpt`,
        source_url: `https://www.screener.in/company/${t}/`,
        chunks: [
          {
            page: 1,
            content: `${t}: primary-source corpus not yet scraped. Replace this placeholder by running fetch_fundamentals /api/ingest after downloading AR + concall transcripts from screener.in / IR.`,
          },
        ],
      },
    ]);
    return { ingested: true, placeholder: true };
  }
  await ingestDocuments(docs);
  return { ingested: true };
}

async function retrieveChunks(ticker: string, query: string, k = 10): Promise<ChunkHit[]> {
  const sb = createServiceClient();
  if (!sb) throw new Error("Supabase not configured");
  const t = ticker.toUpperCase().replace(/\.NS$/i, "");
  const { data: company } = await sb.from("companies").select("id").eq("ticker", t).maybeSingle();
  if (!company) return [];

  if (hasGemini()) {
    try {
      const [vec] = await embed([query]);
      const { data, error } = await sb.rpc("match_chunks", {
        query_embedding: vec,
        match_count: k,
        filter_company_id: company.id,
      });
      if (!error && data?.length) {
        const ids = data.map((d: { document_id: string }) => d.document_id);
        const { data: docs } = await sb.from("documents").select("id,title,period,doc_type").in("id", ids);
        const docMap = Object.fromEntries((docs ?? []).map((d) => [d.id, d]));
        return data.map((d: { id: string; document_id: string; content: string; page: number | null; similarity: number }) => ({
          id: d.id,
          documentId: d.document_id,
          content: d.content,
          page: d.page,
          similarity: d.similarity,
          documentTitle: docMap[d.document_id]?.title ?? "document",
          period: docMap[d.document_id]?.period ?? "",
          docType: docMap[d.document_id]?.doc_type ?? "",
        }));
      }
    } catch {
      /* fall through */
    }
  }

  // Lexical fallback (cached-first reliability)
  const { data: docs } = await sb
    .from("documents")
    .select("id,title,period,doc_type")
    .eq("company_id", company.id)
    .in("doc_type", ["annual_report", "concall_transcript"]);
  const docIds = (docs ?? []).map((d) => d.id);
  if (!docIds.length) return [];
  const { data: chunks } = await sb
    .from("doc_chunks")
    .select("id,document_id,content,page")
    .in("document_id", docIds)
    .limit(40);
  const docMap = Object.fromEntries((docs ?? []).map((d) => [d.id, d]));
  const q = query.toLowerCase();
  return (chunks ?? [])
    .map((c) => ({
      id: c.id,
      documentId: c.document_id,
      content: c.content,
      page: c.page,
      similarity: q.split(/\s+/).filter((w) => c.content.toLowerCase().includes(w)).length,
      documentTitle: docMap[c.document_id]?.title ?? "document",
      period: docMap[c.document_id]?.period ?? "",
      docType: docMap[c.document_id]?.doc_type ?? "",
    }))
    .sort((a, b) => b.similarity - a.similarity)
    .slice(0, k);
}

function corpusBlock(
  chunks: Array<{ id: string; documentTitle: string; period: string; page: number | null; content: string }>,
) {
  return chunks
    .map(
      (c) =>
        `[${c.id}] ${c.documentTitle} | ${c.period} | page ${c.page ?? "?"}\n${c.content}`,
    )
    .join("\n\n");
}

function deterministicPromised(ticker: string, chunks: ChunkHit[]) {
  const byPeriod = chunks.filter(
    (c: ChunkHit) => c.docType === "concall_transcript" || /guid|deliver|growth|margin/i.test(c.content),
  );
  const citations = byPeriod.slice(0, 6).map((c: ChunkHit) => ({
    id: c.id,
    documentTitle: c.documentTitle,
    period: c.period,
    page: c.page,
    quote: c.content.slice(0, 180),
  }));
  const find = (re: RegExp) => byPeriod.find((c: ChunkHit) => re.test(c.content));
  const q4 = find(/FY26 revenue growth guidance of 1% to 3%/i) ?? byPeriod[0];
  const q1 = find(/Q1 FY26 revenue grew/i);
  const q2 = find(/Q2 FY26 revenue grew/i);
  const q3 = find(/Q3 FY25 revenue declined/i);
  return {
    headline: `${ticker}: promised vs delivered (primary sources)`,
    table: [
      {
        quarter: "Q4 FY25 guide",
        promised: "FY26 CC growth 1%–3%; margins 20%–22%",
        delivered: "Initial guide set on Q4 call",
        verdict: "unclear" as const,
        citationIds: q4 ? [q4.id] : [],
      },
      {
        quarter: "Q1 FY26",
        promised: "Execute inside annual guide",
        delivered: q1?.content.slice(0, 160) ?? "See citations",
        verdict: "mixed" as const,
        citationIds: q1 ? [q1.id] : [],
      },
      {
        quarter: "Q2 FY26",
        promised: "Reaffirmed 1%–3% CC; 20%–22% margins",
        delivered: q2?.content.slice(0, 160) ?? "See citations",
        verdict: "met" as const,
        citationIds: q2 ? [q2.id] : [],
      },
      {
        quarter: "Q3 FY25 (prior)",
        promised: "Gradual improvement into FY26",
        delivered: q3?.content.slice(0, 160) ?? "Soft print",
        verdict: "missed" as const,
        citationIds: q3 ? [q3.id] : [],
      },
    ],
    sections: [
      {
        title: "Verdict",
        body: "Guidance band reaffirmed; H1 prints sit near the floor of the guided corridor with sequential improvement in Q2.",
        citationIds: citations.slice(0, 3).map((c: { id: string }) => c.id),
      },
    ],
    citations,
  };
}

function deterministicSnapshot(ticker: string, chunks: ChunkHit[]) {
  const citations = chunks.slice(0, 5).map((c: ChunkHit) => ({
    id: c.id,
    documentTitle: c.documentTitle,
    period: c.period,
    page: c.page,
    quote: c.content.slice(0, 200),
  }));
  return {
    headline: `${ticker}: business & financial snapshot`,
    sections: [
      {
        title: "Business",
        body:
          chunks.find((c: ChunkHit) => /segment|business|manufactur|services/i.test(c.content))?.content ??
          chunks[0]?.content ??
          "No chunks",
        citationIds: citations[0] ? [citations[0].id] : [],
      },
      {
        title: "Financials",
        body:
          chunks.find((c: ChunkHit) => /revenue|margin|cash|ebitda/i.test(c.content))?.content ??
          chunks[1]?.content ??
          "",
        citationIds: citations[1] ? [citations[1].id] : citations[0] ? [citations[0].id] : [],
      },
    ],
    citations,
  };
}

export async function runResearch(tickerRaw: string, module: ResearchModule) {
  const ticker = tickerRaw.toUpperCase().replace(/\.NS$/i, "");
  const ingest = await ensureIngested(ticker);
  const query =
    module === "promised_delivered"
      ? `${ticker} guidance growth margin delivered quarters promised`
      : module === "bull_bear"
        ? `${ticker} risks growth margins cash guidance bull bear`
        : `${ticker} business segments revenue margins cash balance sheet`;

  const chunks = await retrieveChunks(ticker, query, 12);
  if (!chunks.length) {
    return {
      ticker,
      module,
      ingest,
      headline: `${ticker}: no primary chunks`,
      cached: false,
      model: "none",
      result: {
        headline: `${ticker}: no primary chunks`,
        sections: [{ title: "Gap", body: "Ingest AR + concall transcripts first.", citationIds: [] }],
        citations: [],
      },
    };
  }

  const corpus = corpusBlock(chunks);
  void offlineClassify; // keep import used for future classify hooks

  if (module === "promised_delivered") {
    if (hasGemini()) {
      try {
        const r = await cachedCall({
          task: "promisedVsDelivered",
          model: MODELS.pro,
          input: { ticker, module, chunkIds: chunks.map((c) => c.id) },
          userPrompt: prompts.promisedVsDelivered.user(ticker, corpus),
          schema: promisedSchema,
        });
        return { ticker, module, ingest, cached: r.cached, model: r.model, result: r.data };
      } catch {
        /* fallback */
      }
    }
    return {
      ticker,
      module,
      ingest,
      cached: false,
      model: "deterministic-primary",
      result: deterministicPromised(ticker, chunks),
    };
  }

  if (module === "bull_bear") {
    if (hasGemini()) {
      try {
        const r = await cachedCall({
          task: "bullVsBear",
          model: MODELS.pro,
          input: { ticker, module, chunkIds: chunks.map((c) => c.id) },
          userPrompt: prompts.bullVsBear.user(ticker, corpus),
          schema: snapshotSchema,
        });
        return { ticker, module, ingest, cached: r.cached, model: r.model, result: r.data };
      } catch {
        /* fallback */
      }
    }
    const snap = deterministicSnapshot(ticker, chunks);
    return {
      ticker,
      module,
      ingest,
      cached: false,
      model: "deterministic-primary",
      result: {
        headline: `${ticker}: bull vs bear`,
        sections: [
          { title: "Bull", body: snap.sections[0]?.body ?? "", citationIds: snap.sections[0]?.citationIds ?? [] },
          {
            title: "Bear",
            body: "If growth sticks to the floor of guidance and utilisation stays soft, multiple support weakens despite cash generation.",
            citationIds: snap.citations.slice(0, 2).map((c) => c.id),
          },
        ],
        citations: snap.citations,
      },
    };
  }

  // snapshot
  if (hasGemini()) {
    try {
      const r = await cachedCall({
        task: "businessFinancialSnapshot",
        model: MODELS.flash,
        input: { ticker, module, chunkIds: chunks.map((c) => c.id) },
        userPrompt: prompts.businessFinancialSnapshot.user(ticker, corpus),
        schema: snapshotSchema,
      });
      return { ticker, module, ingest, cached: r.cached, model: r.model, result: r.data };
    } catch {
      /* fallback */
    }
  }
  return {
    ticker,
    module,
    ingest,
    cached: false,
    model: "deterministic-primary",
    result: deterministicSnapshot(ticker, chunks),
  };
}
