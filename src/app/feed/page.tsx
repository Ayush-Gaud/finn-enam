"use client";

import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { ChevronDown } from "lucide-react";
import { Segmented } from "@/components/ui/Segmented";
import { SkeletonStack } from "@/components/ui/Skeleton";
import { Delta } from "@/components/ui/Delta";
import { Sparkline } from "@/components/ui/Sparkline";
import { Card } from "@/components/ui/Card";
import { compactInrCr, relativeTime } from "@/lib/format";
import { categoryIcon, sentimentAccent, sentimentForCategory } from "@/lib/sentiment";

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

function monogram(name: string) {
  return name
    .split(/\s+/)
    .slice(0, 2)
    .map((p) => p[0])
    .join("")
    .toUpperCase();
}

function MatChip({ category, level }: { category: string; level: string }) {
  const sentiment = sentimentForCategory(category);
  const accent = sentimentAccent(sentiment);
  return (
    <span
      className="inline-flex shrink-0 items-center gap-1.5 rounded-full px-2 py-1 text-[10px] font-semibold tracking-[0.06em] uppercase"
      style={{ background: accent.soft, color: accent.text }}
    >
      <span className="h-1.5 w-1.5 rounded-full" style={{ background: accent.rule }} />
      {level}
    </span>
  );
}

function ResultsTable({ e }: { e: Extract<Enrichment, { type: "results" }> }) {
  const rows = ["revenue", "ebitda", "pbt", "pat"] as const;
  return (
    <div className="glass glass-elevated mt-4 overflow-hidden !rounded-xl">
      <div className="relative z-[2] flex items-center justify-between px-3 py-2">
        <span className="label !text-[var(--secondary)]">{e.period}</span>
        <span className="tabular text-[10px] text-[var(--muted)]">{e.unit}</span>
      </div>
      <div className="relative z-[2] grid grid-cols-[1fr_1.05fr_0.95fr_0.95fr_auto] gap-x-1 px-3 pb-3 text-[11px]">
        <span className="label pb-1">Metric</span>
        <span className="label pb-1 text-right">This Q</span>
        <span className="label pb-1 text-right">QoQ</span>
        <span className="label pb-1 text-right">YoY</span>
        <span />
        {rows.map((k) => (
          <div key={k} className="contents">
            <span className="border-t border-[var(--hairline)] py-2 capitalize text-[var(--secondary)]">{k}</span>
            <span className="border-t border-[var(--hairline)] py-2 text-right tabular font-medium text-[var(--text)]">
              {compactInrCr(e.latest[k])}
            </span>
            <span className="flex items-center justify-end border-t border-[var(--hairline)] py-2">
              <Delta value={e.qoq[k]} />
            </span>
            <span className="flex items-center justify-end border-t border-[var(--hairline)] py-2">
              <Delta value={e.yoy[k]} />
            </span>
            <span className="flex items-center justify-end border-t border-[var(--hairline)] py-2">
              <Sparkline values={[e.qoq[k], e.yoy[k]]} />
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

function FilingRow({ f, index }: { f: FilingCard; index: number }) {
  const sentiment = sentimentForCategory(f.category);
  const accent = sentimentAccent(sentiment);
  const Icon = categoryIcon(f.category);
  const yoyPat =
    f.enrichment?.type === "results" ? (f.enrichment.yoy.pat ?? f.enrichment.yoy.revenue) : null;

  return (
    <motion.article
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.22, delay: Math.min(index * 0.04, 0.24), ease: "easeOut" }}
      className="glass overflow-hidden p-4"
    >
      <div
        className="absolute top-3 bottom-3 left-0 z-[2] w-[3px] rounded-r-full"
        style={{ background: accent.rule }}
        aria-hidden
      />
      <div className="relative z-[2] pl-2">
        <div className="flex items-start justify-between gap-3">
          <div className="flex min-w-0 flex-wrap items-center gap-2">
            <span className="tabular text-xs font-semibold text-[var(--text)]">{f.ticker}</span>
            <span className="inline-flex items-center gap-1 text-[var(--muted)]">
              <Icon className="h-3 w-3" strokeWidth={2} />
              <span className="label !normal-case !tracking-normal">{f.category.replaceAll("_", " ")}</span>
            </span>
          </div>
          <MatChip category={f.category} level={f.materiality} />
        </div>

        <h3 className="heading mt-2.5 text-[1.05rem] leading-snug text-[var(--text)]">{f.title}</h3>
        <p className="mt-1 text-xs text-[var(--muted)]">{f.companyName}</p>
        <p className="mt-2 line-clamp-2 text-sm leading-relaxed text-[var(--secondary)]">{f.summary}</p>

        {f.enrichment?.type === "results" && <ResultsTable e={f.enrichment} />}

        {f.enrichment?.type === "management_change" && (
          <div className="glass glass-elevated mt-4 flex gap-3 !rounded-xl p-3">
            <div className="accent-gradient relative z-[2] flex h-11 w-11 shrink-0 items-center justify-center rounded-full text-sm font-bold text-[#0A0A0F]">
              {monogram(f.enrichment.personName)}
            </div>
            <div className="relative z-[2] min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <p className="heading text-[0.95rem]">{f.enrichment.personName}</p>
                <span
                  className="rounded-full px-2 py-0.5 text-[10px] font-semibold tracking-[0.06em] uppercase"
                  style={{ background: accent.soft, color: accent.text }}
                >
                  context
                </span>
              </div>
              <p className="mt-1 text-xs text-[var(--secondary)]">
                {f.enrichment.role} · {f.enrichment.action}
              </p>
              <p className="mt-1 line-clamp-2 text-xs leading-relaxed text-[var(--muted)]">{f.enrichment.bio}</p>
            </div>
          </div>
        )}

        <div className="mt-3 flex items-center justify-between gap-2">
          <p className="text-xs text-[var(--muted)]">{relativeTime(f.filedAt)}</p>
          {yoyPat != null && <Delta value={yoyPat} />}
        </div>
      </div>
    </motion.article>
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
        <h2 className="heading text-2xl">Digest</h2>
        <p className="mt-1 text-sm text-[var(--secondary)]">What matters. Everything else folded away.</p>
      </div>

      <Segmented
        options={[
          { id: "24h", label: "24h" },
          { id: "7d", label: "7d" },
          { id: "30d", label: "30d" },
        ]}
        value={window}
        onChange={setWindow}
      />

      {loading && <SkeletonStack rows={3} />}
      {error && (
        <Card>
          <p className="relative z-[2] text-sm text-[var(--down)]">{error}</p>
        </Card>
      )}

      {!loading && !error && (
        <>
          <p className="label">
            {material.length} material · {routine.length} routine
          </p>
          <div className="space-y-3">
            {material.map((f, i) => (
              <FilingRow key={f.id} f={f} index={i} />
            ))}
            {material.length === 0 && (
              <Card>
                <p className="relative z-[2] text-sm text-[var(--secondary)]">Quiet tape in this window. Widen it.</p>
              </Card>
            )}
          </div>

          {routine.length > 0 && (
            <div>
              <button
                type="button"
                onClick={() => setShowRoutine((v) => !v)}
                className="glass relative z-[2] flex min-h-11 w-full items-center justify-between px-4 text-sm text-[var(--secondary)]"
              >
                <span className="relative z-[2]">{routine.length} routine hidden</span>
                <ChevronDown
                  className={`relative z-[2] h-4 w-4 transition duration-200 ${showRoutine ? "rotate-180" : ""}`}
                  strokeWidth={1.75}
                />
              </button>
              <AnimatePresence initial={false}>
                {showRoutine && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: "auto", opacity: 0.95 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.22, ease: "easeOut" }}
                    className="overflow-hidden"
                  >
                    <div className="mt-3 space-y-3">
                      {routine.map((f, i) => (
                        <FilingRow key={f.id} f={f} index={i} />
                      ))}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          )}
        </>
      )}
    </div>
  );
}
