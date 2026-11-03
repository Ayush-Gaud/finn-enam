"use client";

import { useEffect, useState } from "react";
import { Card } from "@/components/ui/Card";

type Enrichment =
  | {
      type: "results";
      period: string;
      unit: string;
      latest: Record<string, number | null>;
      qoq: Record<string, number | null>;
      yoy: Record<string, number | null>;
    }
  | {
      type: "management_change";
      personName: string;
      role: string;
      action: string;
      bio: string;
      label?: string;
    };

type FilingCard = {
  id: string;
  ticker: string;
  companyName: string;
  filedAt: string;
  title: string;
  category: string;
  materiality: string;
  summary: string;
  routine: boolean;
  enrichment?: Enrichment;
};

function fmtPct(n: number | null | undefined) {
  if (n == null) return "—";
  const s = n > 0 ? "+" : "";
  return `${s}${n.toFixed(1)}%`;
}

function ResultsCard({ e }: { e: Extract<Enrichment, { type: "results" }> }) {
  const rows = ["revenue", "ebitda", "pbt", "pat"] as const;
  return (
    <div className="mt-3 overflow-hidden rounded-md border border-white/10 bg-black/30">
      <div className="flex justify-between border-b border-white/10 px-3 py-1.5 text-[10px] uppercase tracking-wider text-white/45">
        <span>{e.period}</span>
        <span>{e.unit}</span>
      </div>
      <div className="grid grid-cols-[1fr_auto_auto_auto] gap-x-2 px-3 py-2 text-xs">
        <span />
        <span className="text-right text-white/35">Abs</span>
        <span className="text-right text-white/35">QoQ</span>
        <span className="text-right text-white/35">YoY</span>
        {rows.map((k) => (
          <div key={k} className="contents">
            <span className="py-0.5 capitalize text-white/70">{k}</span>
            <span className="py-0.5 text-right tabular-nums">
              {e.latest[k] == null ? "—" : Number(e.latest[k]).toLocaleString("en-IN")}
            </span>
            <span className={`py-0.5 text-right tabular-nums ${(e.qoq[k] ?? 0) >= 0 ? "text-emerald-300" : "text-rose-300"}`}>
              {fmtPct(e.qoq[k])}
            </span>
            <span className={`py-0.5 text-right tabular-nums ${(e.yoy[k] ?? 0) >= 0 ? "text-emerald-300" : "text-rose-300"}`}>
              {fmtPct(e.yoy[k])}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

function Filing({ f }: { f: FilingCard }) {
  return (
    <article className="rounded-xl border border-white/10 bg-white/[0.03] p-3.5">
      <div className="flex items-start justify-between gap-2">
        <div>
          <p className="text-[10px] uppercase tracking-[0.16em] text-[var(--signal)]">
            {f.ticker} · {f.category}
          </p>
          <h3 className="mt-1 font-[family-name:var(--font-display)] text-lg leading-snug">{f.title}</h3>
        </div>
        <span
          className={`shrink-0 rounded-sm px-1.5 py-0.5 text-[10px] uppercase ${
            f.materiality === "high" ? "bg-rose-400/15 text-rose-200" : "bg-white/10 text-white/50"
          }`}
        >
          {f.materiality}
        </span>
      </div>
      <p className="mt-2 text-sm leading-relaxed text-white/65">{f.summary}</p>
      {f.enrichment?.type === "results" && <ResultsCard e={f.enrichment} />}
      {f.enrichment?.type === "management_change" && (
        <div className="mt-3 rounded-md border border-[var(--signal)]/30 bg-[var(--signal)]/10 px-3 py-2.5">
          <p className="text-[10px] uppercase tracking-wider text-[var(--signal)]">
            {f.enrichment.label ?? "External context"}
          </p>
          <p className="mt-1 text-xs font-medium text-[var(--signal)]">
            {f.enrichment.personName} · {f.enrichment.role} {f.enrichment.action}
          </p>
          <p className="mt-1 text-xs leading-relaxed text-white/70">{f.enrichment.bio}</p>
        </div>
      )}
      <p className="mt-3 text-[10px] text-white/35">
        {new Date(f.filedAt).toLocaleString("en-IN", { timeZone: "Asia/Kolkata" })}
      </p>
    </article>
  );
}

export default function FeedPage() {
  const [window, setWindow] = useState<"24h" | "7d" | "30d">("7d");
  const [material, setMaterial] = useState<FilingCard[]>([]);
  const [routine, setRoutine] = useState<FilingCard[]>([]);
  const [showRoutine, setShowRoutine] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setLoading(true);
    setError(null);
    fetch(`/api/digest?window=${window}`)
      .then(async (r) => {
        const j = await r.json();
        if (!r.ok) throw new Error(j.error ?? "Failed");
        setMaterial(j.material ?? []);
        setRoutine(j.routine ?? []);
      })
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, [window]);

  return (
    <div className="space-y-4">
      <div>
        <h1 className="font-[family-name:var(--font-display)] text-3xl tracking-tight">Feed</h1>
        <p className="mt-1 text-sm text-white/50">Material first. Routine collapsed.</p>
      </div>

      <div className="flex gap-1 rounded-lg bg-white/5 p-1">
        {(["24h", "7d", "30d"] as const).map((w) => (
          <button
            key={w}
            type="button"
            onClick={() => setWindow(w)}
            className={`flex-1 rounded-md py-2 text-sm ${window === w ? "bg-white/15 text-white" : "text-white/50"}`}
          >
            {w}
          </button>
        ))}
      </div>

      {loading && (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-28 animate-pulse rounded-xl bg-white/5" />
          ))}
        </div>
      )}
      {error && <Card><p className="text-sm text-rose-300">{error}</p></Card>}

      {!loading && !error && (
        <>
          <p className="text-xs text-white/40">
            {material.length} material · {routine.length} routine
          </p>
          <div className="space-y-3">
            {material.map((f) => (
              <Filing key={f.id} f={f} />
            ))}
            {material.length === 0 && (
              <Card>
                <p className="text-sm text-white/60">No material filings in this window. Try 7d/30d or re-seed filings.</p>
              </Card>
            )}
          </div>
          {routine.length > 0 && (
            <div>
              <button
                type="button"
                className="text-sm text-white/45 underline-offset-2 hover:underline"
                onClick={() => setShowRoutine((v) => !v)}
              >
                {showRoutine ? "Hide" : "Show"} {routine.length} routine filings
              </button>
              {showRoutine && (
                <div className="mt-3 space-y-3 opacity-70">
                  {routine.map((f) => (
                    <Filing key={f.id} f={f} />
                  ))}
                </div>
              )}
            </div>
          )}
        </>
      )}
    </div>
  );
}
