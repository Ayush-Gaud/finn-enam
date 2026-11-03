"use client";

import { useCallback, useEffect, useState } from "react";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";

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
          <h1 className="font-[family-name:var(--font-display)] text-3xl tracking-tight">Alerts</h1>
          <p className="mt-1 text-sm text-white/50">Unusual moves + material filings.</p>
        </div>
        <Button variant="outline" onClick={load}>
          Refresh
        </Button>
      </div>

      {thresholds && (
        <p className="text-xs text-white/40">
          vol ≥ {String(thresholds.volMultiple)}× · price ±{String(thresholds.pricePct)}% · window{" "}
          {String(thresholds.windowHours)}h
        </p>
      )}

      {loading && (
        <div className="space-y-3">
          {[1, 2].map((i) => (
            <div key={i} className="h-24 animate-pulse rounded-xl bg-white/5" />
          ))}
        </div>
      )}
      {error && (
        <Card>
          <p className="text-sm text-rose-300">{error}</p>
        </Card>
      )}

      {!loading && alerts.length === 0 && (
        <Card>
          <p className="text-sm text-white/60">No alerts with current thresholds.</p>
        </Card>
      )}

      <div className="space-y-3">
        {alerts.map((a) => (
          <article
            key={a.id}
            className={`rounded-xl border p-3.5 ${
              a.severity === "high" ? "border-rose-400/30 bg-rose-400/10" : "border-white/10 bg-white/[0.03]"
            }`}
          >
            <p className="text-[10px] uppercase tracking-[0.14em] text-white/45">
              {a.kind.replaceAll("_", " ")} · {a.asOf}
            </p>
            <h3 className="mt-1 font-[family-name:var(--font-display)] text-xl tracking-tight">{a.headline}</h3>
            <p className="mt-1 text-sm leading-relaxed text-white/70">{a.reason}</p>
            <p className="mt-2 text-xs text-white/40">{a.companyName}</p>
          </article>
        ))}
      </div>
    </div>
  );
}
