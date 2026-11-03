import { createServiceClient } from "@/lib/supabase";
import { embed } from "@/lib/ai/router";
import { hasGemini } from "@/lib/env";

export type SeedChunk = { content: string; page?: number };

export type SeedDoc = {
  ticker: string;
  yahoo_symbol?: string;
  name?: string;
  sector?: string;
  doc_type: "annual_report" | "concall_transcript" | "quarterly_results" | "investor_presentation";
  period: string;
  title: string;
  source_url: string;
  chunks: SeedChunk[];
};

function chunkText(text: string, target = 1000, overlap = 150): string[] {
  const words = text.split(/\s+/);
  const chunks: string[] = [];
  let i = 0;
  while (i < words.length) {
    const slice = words.slice(i, i + target);
    chunks.push(slice.join(" "));
    i += Math.max(target - overlap, 1);
  }
  return chunks.filter((c) => c.trim().length > 40);
}

export async function ensureCompany(ticker: string, meta?: { yahoo_symbol?: string; name?: string; sector?: string }) {
  const sb = createServiceClient();
  if (!sb) throw new Error("Supabase not configured");
  const t = ticker.toUpperCase().replace(/\.NS$/i, "");
  const yahoo = meta?.yahoo_symbol ?? `${t}.NS`;
  const { data: existing } = await sb.from("companies").select("id").eq("ticker", t).maybeSingle();
  if (existing) return existing.id;
  const { data, error } = await sb
    .from("companies")
    .upsert(
      {
        ticker: t,
        yahoo_symbol: yahoo,
        name: meta?.name ?? t,
        sector: meta?.sector ?? "Unknown",
        in_portfolio: false,
      },
      { onConflict: "ticker" },
    )
    .select("id")
    .maybeSingle();
  if (error || !data) throw new Error(error?.message ?? "company upsert failed");
  return data.id;
}

export async function ingestDocuments(docs: SeedDoc[]): Promise<{ documents: number; chunks: number }> {
  const sb = createServiceClient();
  if (!sb) throw new Error("Supabase not configured");
  let documents = 0;
  let chunks = 0;

  for (const doc of docs) {
    const companyId = await ensureCompany(doc.ticker, {
      yahoo_symbol: doc.yahoo_symbol,
      name: doc.name,
      sector: doc.sector,
    });

    const { data: existingDocs } = await sb
      .from("documents")
      .select("id")
      .eq("company_id", companyId)
      .eq("doc_type", doc.doc_type)
      .eq("period", doc.period);

    if (existingDocs && existingDocs.length > 0) {
      // idempotent: skip if already present
      continue;
    }

    const { data: inserted, error } = await sb
      .from("documents")
      .insert({
        company_id: companyId,
        doc_type: doc.doc_type,
        period: doc.period,
        title: doc.title,
        source_url: doc.source_url,
      })
      .select("id")
      .single();
    if (error || !inserted) throw new Error(error?.message ?? "document insert failed");
    documents += 1;

    const parts =
      doc.chunks.length > 0
        ? doc.chunks
        : chunkText(doc.chunks.map((c) => c.content).join("\n") || doc.title).map((content, i) => ({
            content,
            page: i + 1,
          }));

    let embeddings: number[][] | null = null;
    if (hasGemini()) {
      try {
        embeddings = await embed(parts.map((p) => p.content));
      } catch {
        embeddings = null;
      }
    }

    const rows = parts.map((p, idx) => ({
      document_id: inserted.id,
      chunk_index: idx,
      content: p.content,
      page: p.page ?? null,
      embedding: embeddings ? `[${embeddings[idx].join(",")}]` : null,
    }));

    // Supabase JS expects embedding as string for vector or as array depending on version
    const payload = rows.map((r) => ({
      document_id: r.document_id,
      chunk_index: r.chunk_index,
      content: r.content,
      page: r.page,
      embedding: embeddings ? embeddings[rows.indexOf(r)] : null,
    }));

    const { error: cErr } = await sb.from("doc_chunks").insert(payload);
    if (cErr) throw new Error(cErr.message);
    chunks += payload.length;
  }

  return { documents, chunks };
}

export async function companyHasPrimaryDocs(ticker: string): Promise<boolean> {
  const sb = createServiceClient();
  if (!sb) return false;
  const t = ticker.toUpperCase().replace(/\.NS$/i, "");
  const { data: company } = await sb.from("companies").select("id").eq("ticker", t).maybeSingle();
  if (!company) return false;
  const { count } = await sb
    .from("documents")
    .select("id", { count: "exact", head: true })
    .eq("company_id", company.id)
    .in("doc_type", ["annual_report", "concall_transcript"]);
  return (count ?? 0) > 0;
}
