import { NextRequest, NextResponse } from "next/server";
import { PRIMARY_CORPUS } from "@/data/primaryCorpus";
import { companyHasPrimaryDocs, ingestDocuments } from "@/lib/research/ingest";

export async function GET(req: NextRequest) {
  const ticker = (req.nextUrl.searchParams.get("ticker") ?? "").toUpperCase().replace(/\.NS$/i, "");
  if (!ticker) return NextResponse.json({ error: "ticker required" }, { status: 400 });

  try {
    if (await companyHasPrimaryDocs(ticker)) {
      return NextResponse.json({ ticker, status: "already_ingested" });
    }
    const docs = PRIMARY_CORPUS.filter((d) => d.ticker === ticker);
    if (docs.length === 0) {
      const result = await ingestDocuments([
        {
          ticker,
          name: ticker,
          sector: "Unknown",
          doc_type: "annual_report",
          period: "FY25",
          title: `${ticker} IR placeholder (awaiting screener fetch)`,
          source_url: `https://www.screener.in/company/${ticker}/`,
          chunks: [
            {
              page: 1,
              content: `${ticker} primary docs not in demo corpus. Run scripts/fetch_fundamentals.py after schema seed, or upload AR/transcript excerpts.`,
            },
          ],
        },
      ]);
      return NextResponse.json({ ticker, status: "placeholder_ingested", ...result });
    }
    const result = await ingestDocuments(docs);
    return NextResponse.json({ ticker, status: "ingested", ...result });
  } catch (e) {
    return NextResponse.json({ error: e instanceof Error ? e.message : "ingest failed" }, { status: 500 });
  }
}
