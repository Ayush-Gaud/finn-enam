"use client";

import { Suspense, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
import { Search } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Segmented } from "@/components/ui/Segmented";
import { Skeleton, SkeletonStack } from "@/components/ui/Skeleton";

type Module = "snapshot" | "bull_bear" | "promised_delivered";

const MODULES: { id: Module; label: string }[] = [
  { id: "snapshot", label: "Snapshot" },
  { id: "bull_bear", label: "Bull / Bear" },
  { id: "promised_delivered", label: "Promised" },
];

const verdictStyle: Record<string, string> = {
  met: "bg-[var(--up-soft)] text-[var(--up)]",
  beat: "bg-[var(--up-soft)] text-[var(--up)]",
  missed: "bg-[var(--down-soft)] text-[var(--down)]",
  mixed: "bg-[var(--neutral-soft)] text-[var(--neutral)]",
  unclear: "bg-[var(--glass-elevated)] text-[var(--muted)]",
};

function ResearchInner() {
  const params = useSearchParams();
  const [ticker, setTicker] = useState("INFY");
  const [module, setModule] = useState<Module>("promised_delivered");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [data, setData] = useState<Record<string, unknown> | null>(null);
  const [openCite, setOpenCite] = useState<Record<string, boolean>>({});

  useEffect(() => {
    const t = params.get("ticker");
    if (t) setTicker(t.toUpperCase());
  }, [params]);

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
    citations: Array<{
      id: string;
      documentTitle: string;
      period: string;
      page?: number | null;
      quote: string;
    }>;
  };

  const citeMap = Object.fromEntries((result?.citations ?? []).map((c) => [c.id, c]));

  return (
    <div className="space-y-4">
      <div>
        <h2 className="heading text-2xl">Research</h2>
        <p className="mt-1 text-sm text-[var(--secondary)]">Primary sources only. Every claim cited.</p>
      </div>

      <div className="relative">
        <Search
          className="pointer-events-none absolute left-3.5 top-1/2 z-[3] h-4 w-4 -translate-y-1/2 text-[var(--muted)]"
          strokeWidth={1.75}
        />
        <input
          value={ticker}
          onChange={(e) => setTicker(e.target.value.toUpperCase())}
          placeholder="Search any NSE ticker"
          className="glass relative z-[2] min-h-11 w-full py-2.5 pr-3 pl-11 text-sm outline-none placeholder:text-[var(--muted)]"
        />
      </div>

      <Segmented options={MODULES} value={module} onChange={setModule} />

      <Button className="w-full" onClick={() => void run()} disabled={loading || !ticker}>
        {loading ? "Analysing…" : "Run research"}
      </Button>

      {loading && (
        <div className="space-y-3">
          <Skeleton className="h-8 w-3/4" />
          <Skeleton className="h-36 w-full" />
          <Skeleton className="h-24 w-full" />
        </div>
      )}

      {error && (
        <Card>
          <p className="relative z-[2] text-sm text-[var(--down)]">{error}</p>
        </Card>
      )}

      {result && (
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.22, ease: "easeOut" }}
          className="space-y-4"
        >
          <div className="flex items-start justify-between gap-2">
            <h3 className="heading text-xl leading-snug">{result.headline}</h3>
            <span className="shrink-0 rounded-full bg-[var(--glass-elevated)] px-2 py-1 text-[10px] font-medium tracking-[0.06em] text-[var(--muted)] uppercase shadow-[inset_0_0_0_1px_var(--hairline)]">
              {data?.cached ? "cached" : String(data?.model ?? "")}
            </span>
          </div>

          {result.table && (
            <div className="glass overflow-hidden !p-0">
              <div className="relative z-[2] bg-[var(--glass-elevated)] px-4 py-2.5">
                <p className="label accent-text !bg-clip-text">Promised → delivered → verdict</p>
              </div>
              {result.table.map((row) => (
                <div
                  key={row.quarter}
                  className="relative z-[2] border-b border-[var(--hairline)] px-4 py-3.5 last:border-0"
                >
                  <div className="flex items-center justify-between gap-2">
                    <p className="heading text-[1rem]">{row.quarter}</p>
                    <span
                      className={`rounded-full px-2 py-0.5 text-[10px] font-semibold tracking-[0.06em] uppercase ${
                        verdictStyle[row.verdict] ?? verdictStyle.unclear
                      }`}
                    >
                      {row.verdict}
                    </span>
                  </div>
                  <p className="mt-2 text-xs text-[var(--muted)]">
                    <span className="label mr-2 inline">Promised</span>
                    {row.promised}
                  </p>
                  <p className="mt-1.5 text-xs text-[var(--secondary)]">
                    <span className="label mr-2 inline">Delivered</span>
                    <span className="tabular">{row.delivered}</span>
                  </p>
                </div>
              ))}
            </div>
          )}

          {(result.sections ?? []).map((s) => (
            <section key={s.title} className="glass p-4">
              <div className="relative z-[2] mb-2 inline-flex rounded-full bg-[var(--accent-soft)] px-2.5 py-1">
                <span className="text-[11px] font-semibold tracking-[0.06em] text-[var(--accent)] uppercase">
                  {s.title}
                </span>
              </div>
              <p className="relative z-[2] text-sm leading-relaxed text-[var(--secondary)]">{s.body}</p>
              {s.citationIds?.length > 0 && (
                <>
                  <button
                    type="button"
                    className="relative z-[2] mt-3 min-h-11 text-left text-xs font-medium text-[var(--accent)]"
                    onClick={() => setOpenCite((o) => ({ ...o, [s.title]: !o[s.title] }))}
                  >
                    {openCite[s.title] ? "Hide" : "Show"} footnotes ({s.citationIds.length})
                  </button>
                  <AnimatePresence initial={false}>
                    {openCite[s.title] && (
                      <motion.ul
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: "auto", opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.2, ease: "easeOut" }}
                        className="relative z-[2] mt-2 space-y-2 overflow-hidden border-l-2 border-[var(--accent)]/40 pl-3"
                      >
                        {s.citationIds.map((id) => {
                          const c = citeMap[id];
                          if (!c) return null;
                          return (
                            <li key={id} className="text-[11px] leading-relaxed text-[var(--muted)]">
                              <span className="font-medium text-[var(--secondary)]">
                                {c.documentTitle} · {c.period}
                                {c.page != null ? ` · p.${c.page}` : ""}
                              </span>
                              <br />
                              <span className="text-[var(--secondary)]">“{c.quote}”</span>
                            </li>
                          );
                        })}
                      </motion.ul>
                    )}
                  </AnimatePresence>
                </>
              )}
            </section>
          ))}
        </motion.div>
      )}

      {!loading && !result && !error && (
        <Card>
          <p className="relative z-[2] heading text-lg">Start with a name.</p>
          <p className="relative z-[2] mt-1 text-sm text-[var(--secondary)]">
            Try INFY → Promised, or POLYCAB to prove it isn’t hard-wired.
          </p>
        </Card>
      )}
    </div>
  );
}

export default function ResearchPage() {
  return (
    <Suspense fallback={<SkeletonStack rows={3} />}>
      <ResearchInner />
    </Suspense>
  );
}
