import { NextResponse } from "next/server";
import { PRIMARY_CORPUS } from "@/data/primaryCorpus";
import { ingestDocuments } from "@/lib/research/ingest";

/** One-shot demo corpus ingest (idempotent). */
export async function POST() {
  try {
    const result = await ingestDocuments(PRIMARY_CORPUS);
    return NextResponse.json({ ok: true, ...result, docsInCorpus: PRIMARY_CORPUS.length });
  } catch (e) {
    return NextResponse.json({ ok: false, error: e instanceof Error ? e.message : "seed failed" }, { status: 500 });
  }
}
