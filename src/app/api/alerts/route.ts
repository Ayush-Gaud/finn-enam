import { NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase";
import { isUnusualPrice, isUnusualVolume } from "@/lib/finance";
import { materialityForCategory } from "@/lib/materiality";

export async function GET() {
  const sb = createServiceClient();
  if (!sb) return NextResponse.json({ error: "Supabase not configured" }, { status: 503 });

  const { data: settings } = await sb.from("user_settings").select("*").eq("id", 1).maybeSingle();
  const volMultiple = Number(settings?.vol_multiple ?? 2);
  const pricePct = Number(settings?.price_pct ?? 5);
  const muted: string[] = settings?.muted_categories ?? [];
  const windowHours = Number(settings?.window_hours ?? 24);

  const { data: companies } = await sb.from("companies").select("id,ticker,name").eq("in_portfolio", true);
  const alerts: Array<Record<string, unknown>> = [];

  for (const c of companies ?? []) {
    const { data: bars } = await sb
      .from("prices_eod")
      .select("*")
      .eq("company_id", c.id)
      .order("date", { ascending: false })
      .limit(1);
    const bar = bars?.[0];
    if (!bar) continue;

    if (isUnusualVolume(Number(bar.volume), bar.avg_vol_20d == null ? null : Number(bar.avg_vol_20d), volMultiple)) {
      const ratio = Number(bar.volume) / Number(bar.avg_vol_20d);
      alerts.push({
        id: `vol-${c.ticker}-${bar.date}`,
        kind: "unusual_volume",
        severity: ratio >= volMultiple * 1.5 ? "high" : "medium",
        ticker: c.ticker,
        companyName: c.name,
        asOf: bar.date,
        headline: `${c.ticker} volume ${ratio.toFixed(1)}× average`,
        reason: `Traded ${(Number(bar.volume) / 1e6).toFixed(1)}M shares vs 20-day avg ${(Number(bar.avg_vol_20d) / 1e6).toFixed(1)}M — above your ${volMultiple}× threshold.`,
      });
    }

    if (isUnusualPrice(bar.pct_change_1d == null ? null : Number(bar.pct_change_1d), pricePct)) {
      const pct = Number(bar.pct_change_1d);
      alerts.push({
        id: `px-${c.ticker}-${bar.date}`,
        kind: "unusual_price",
        severity: Math.abs(pct) >= pricePct * 1.25 ? "high" : "medium",
        ticker: c.ticker,
        companyName: c.name,
        asOf: bar.date,
        headline: `${c.ticker} ${pct >= 0 ? "up" : "down"} ${Math.abs(pct).toFixed(1)}%`,
        reason: `EOD move ${pct.toFixed(1)}% exceeds your ±${pricePct}% threshold (close ₹${Number(bar.close).toFixed(1)}).`,
      });
    }
  }

  const cutoff = new Date(Date.now() - windowHours * 3600 * 1000).toISOString();
  const { data: filings } = await sb
    .from("filings")
    .select("*, companies(ticker,name)")
    .gte("filed_at", cutoff)
    .order("filed_at", { ascending: false });

  for (const f of filings ?? []) {
    const cat = f.category;
    if (muted.includes(cat)) continue;
    const mat = f.materiality || materialityForCategory(cat);
    if (mat !== "high") continue;
    const co = f.companies as { ticker: string; name: string } | null;
    alerts.push({
      id: `fil-${f.id}`,
      kind: "material_filing",
      severity: "high",
      ticker: co?.ticker,
      companyName: co?.name,
      asOf: f.filed_at,
      headline: `${co?.ticker}: ${f.title}`,
      reason: `Material ${cat} filing — ${f.summary}`,
      category: cat,
    });
  }

  alerts.sort((a, b) => (a.severity === b.severity ? 0 : a.severity === "high" ? -1 : 1));

  return NextResponse.json({
    thresholds: { volMultiple, pricePct, windowHours, mutedCategories: muted },
    alerts,
  });
}
