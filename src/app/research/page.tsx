"use client";

import { useState } from "react";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";

type Module = "snapshot" | "bull_bear" | "promised_delivered";

const MODULES: { id: Module; label: string }[] = [
  { id: "snapshot", label: "Snapshot" },
  { id: "bull_bear", label: "Bull vs Bear" },
  { id: "promised_delivered", label: "Promised vs Delivered" },
];

export default function ResearchPage() {
  const [ticker, setTicker] = useState("INFY");
  const [module, setModule] = useState<Module>("promised_delivered");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [data, setData] = useState<Record<string, unknown> | null>(null);
  const [openCite, setOpenCite] = useState<Record<string, boolean>>({});

  async function run() {
    setLoading(true);
    setError(null);
    setData(null);
    try {
      const r = await fetch(`/api/research?ticker=${encodeURIComponent(ticker)}&module=${module}`);
      const j = await r.json();
      if (!r.ok) throw new Error(j.error ?? "Research failed");
      setData(j);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed");
    } finally {
      setLoading(false);
    }
  }

  const result = (data?.result ?? null) as null | {
    headline: string;
    sections?: Array<{ title: string; body: string; citationIds: string[] }>;
    table?: Array<{
      quarter: string;
      promised: string;
      delivered: string;
      verdict: string;
      citationIds: string[];
    }>;
    citations: Array<{ id: string; documentTitle: string; period: string; page?: number | null; quote: string }>;
  };

  const citeMap = Object.fromEntries((result?.citations ?? []).map((c) => [c.id, c]));

  return (
    <div className="space-y-4">
      <div>
        <h1 className="font-[family-name:var(--font-display)] text-3xl tracking-tight">Research</h1>
        <p className="mt-1 text-sm text-white/50">Primary sources only — AR + concalls.</p>
      </div>

      <input
        value={ticker}
        onChange={(e) => setTicker(e.target.value.toUpperCase())}
        placeholder="NSE ticker e.g. POLYCAB"
        className="w-full rounded-lg border border-white/15 bg-black/30 px-3 py-2.5 text-sm outline-none focus:border-[var(--signal)]/50"
      />

      <div className="flex gap-2 overflow-x-auto pb-1">
        {MODULES.map((m) => (
          <button
            key={m.id}
            type="button"
            onClick={() => setModule(m.id)}
            className={`shrink-0 rounded-full px-3 py-1.5 text-xs ${
              module === m.id ? "bg-white text-[var(--ink)]" : "bg-white/8 text-white/60"
            }`}
          >
            {m.label}
          </button>
        ))}
      </div>

      <Button className="w-full" onClick={() => void run()} disabled={loading || !ticker}>
        {loading ? "Analysing…" : "Run research"}
      </Button>

      {loading && <div className="h-40 animate-pulse rounded-xl bg-white/5" />}
      {error && (
        <Card>
          <p className="text-sm text-rose-300">{error}</p>
        </Card>
      )}

      {result && (
        <div className="space-y-3">
          <div className="flex items-start justify-between gap-2">
            <h2 className="font-[family-name:var(--font-display)] text-xl leading-snug">{result.headline}</h2>
            <span className="shrink-0 rounded-sm bg-white/10 px-1.5 py-0.5 text-[10px] text-white/45">
              {data?.cached ? "cached" : String(data?.model ?? "")}
            </span>
          </div>

          {result.table && (
            <Card className="space-y-3 !p-3">
              {result.table.map((row) => (
                <div key={row.quarter} className="border-b border-white/10 pb-3 last:border-0 last:pb-0">
                  <div className="flex items-center justify-between gap-2">
                    <p className="text-xs font-medium text-[var(--signal)]">{row.quarter}</p>
                    <span className="rounded-sm bg-white/10 px-1.5 py-0.5 text-[10px] uppercase">{row.verdict}</span>
                  </div>
                  <p className="mt-1 text-xs text-white/55">
                    <span className="text-white/35">Promised:</span> {row.promised}
                  </p>
                  <p className="mt-1 text-xs text-white/70">
                    <span className="text-white/35">Delivered:</span> {row.delivered}
                  </p>
                </div>
              ))}
            </Card>
          )}

          {(result.sections ?? []).map((s) => (
            <section key={s.title} className="rounded-xl border border-white/10 bg-white/[0.03] p-3.5">
              <h3 className="text-xs uppercase tracking-[0.14em] text-[var(--signal)]">{s.title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-white/75">{s.body}</p>
              {s.citationIds?.length > 0 && (
                <button
                  type="button"
                  className="mt-3 text-[11px] text-white/45 underline-offset-2 hover:underline"
                  onClick={() => setOpenCite((o) => ({ ...o, [s.title]: !o[s.title] }))}
                >
                  {openCite[s.title] ? "Hide" : "Show"} citations ({s.citationIds.length})
                </button>
              )}
              {openCite[s.title] && (
                <ul className="mt-2 space-y-2 border-t border-white/10 pt-2">
                  {s.citationIds.map((id) => {
                    const c = citeMap[id];
                    if (!c) return null;
                    return (
                      <li key={id} className="text-[11px] leading-relaxed text-white/45">
                        <span className="text-white/65">
                          {c.documentTitle} · {c.period}
                          {c.page != null ? ` · p.${c.page}` : ""}
                        </span>
                        <br />“{c.quote}”
                      </li>
                    );
                  })}
                </ul>
              )}
            </section>
          ))}
        </div>
      )}

      {!loading && !result && !error && (
        <Card>
          <p className="text-sm text-white/55">Try INFY → Promised vs Delivered, or POLYCAB to prove generalization.</p>
        </Card>
      )}
    </div>
  );
}
