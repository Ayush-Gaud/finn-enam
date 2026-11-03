"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { SkeletonStack } from "@/components/ui/Skeleton";
import { relativeTime } from "@/lib/format";

type Alert = {
  id: string;
  kind: string;
  severity: string;
  ticker: string;
  companyName: string;
  asOf: string;
  headline: string;
  reason: string;
};

function severityDot(kind: string, headline: string, reason: string) {
  const blob = `${kind} ${headline} ${reason}`.toLowerCase();
  const neg = /litigation|pledge|downgrade|drop|plunge|fall|-\d|form 483|missed/.test(blob);
  const pos = /volume|order win|surge|spike|beat|dividend|\+\d|fund.raise|capex/.test(blob);
  if (neg) return "bg-[var(--down)] shadow-[0_0_8px_rgba(244,63,94,0.45)]";
  if (pos) return "bg-[var(--up)] shadow-[0_0_8px_rgba(52,211,153,0.45)]";
  return "bg-[var(--neutral)] shadow-[0_0_8px_rgba(251,191,36,0.35)]";
}

export default function AlertsPage() {
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [thresholds, setThresholds] = useState<Record<string, unknown> | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(() => {
    setLoading(true);
    setError(null);
    fetch("/api/alerts")
      .then(async (r) => {
        const j = await r.json();
        if (!r.ok) throw new Error(j.error ?? "Failed");
        setAlerts(j.alerts ?? []);
        setThresholds(j.thresholds ?? null);
      })
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  return (
    <div className="space-y-4">
      <div className="flex items-end justify-between gap-3">
        <div>
          <h2 className="heading text-2xl">Alerts</h2>
          <p className="mt-1 text-sm text-[var(--secondary)]">Interrupt only when it matters.</p>
        </div>
        <Button variant="outline" onClick={load} className="!px-3">
          <RefreshCw className="relative z-[2] h-4 w-4" strokeWidth={1.75} />
        </Button>
      </div>

      {thresholds && (
        <p className="tabular text-xs text-[var(--muted)]">
          vol ≥ {String(thresholds.volMultiple)}× · ±{String(thresholds.pricePct)}% · {String(thresholds.windowHours)}h
        </p>
      )}

      {loading && <SkeletonStack rows={3} />}
      {error && (
        <Card>
          <p className="relative z-[2] text-sm text-[var(--down)]">{error}</p>
        </Card>
      )}

      {!loading && alerts.length === 0 && !error && (
        <Card>
          <p className="relative z-[2] text-sm text-[var(--secondary)]">No breaches at current thresholds.</p>
        </Card>
      )}

      <div className="glass overflow-hidden !p-0">
        {alerts.map((a, i) => (
          <motion.div
            key={a.id}
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.18, delay: Math.min(i * 0.03, 0.2), ease: "easeOut" }}
            className="relative z-[2] border-b border-[var(--hairline)] last:border-0"
          >
            <Link
              href={`/research?ticker=${a.ticker}`}
              className="flex min-h-11 gap-3 px-4 py-3.5 transition active:bg-[var(--glass-elevated)]"
            >
              <span className={`mt-2 h-2 w-2 shrink-0 rounded-full ${severityDot(a.kind, a.headline, a.reason)}`} />
              <div className="min-w-0 flex-1">
                <div className="flex items-center justify-between gap-2">
                  <span className="tabular text-xs font-semibold text-[var(--text)]">{a.ticker}</span>
                  <span className="text-[11px] text-[var(--muted)]">
                    {relativeTime(a.kind === "material_filing" ? a.asOf : `${a.asOf}T16:00:00+05:30`)}
                  </span>
                </div>
                <p className="heading mt-1 text-[0.95rem] leading-snug">{a.headline}</p>
                <p className="mt-1 text-xs leading-relaxed text-[var(--secondary)]">
                  {a.reason.replaceAll("_", " ")}
                </p>
              </div>
            </Link>
          </motion.div>
        ))}
      </div>
    </div>
  );
}
