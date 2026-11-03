"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";

const CATEGORIES = [
  "results",
  "M&A",
  "fund_raise",
  "management_change",
  "litigation",
  "dividend",
  "unclassified",
  "press_release",
  "capex",
  "earnings_call",
];

type Settings = {
  vol_multiple: number;
  price_pct: number;
  window_hours: number;
  muted_categories: string[];
};

export default function SettingsPage() {
  const [s, setS] = useState<Settings>({
    vol_multiple: 2,
    price_pct: 5,
    window_hours: 24,
    muted_categories: [],
  });
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/settings")
      .then((r) => r.json())
      .then((j) => {
        if (j?.id) {
          setS({
            vol_multiple: Number(j.vol_multiple),
            price_pct: Number(j.price_pct),
            window_hours: Number(j.window_hours),
            muted_categories: j.muted_categories ?? [],
          });
        }
      });
  }, []);

  async function save() {
    setSaving(true);
    setMsg(null);
    try {
      const r = await fetch("/api/settings", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(s),
      });
      const j = await r.json();
      if (!r.ok) throw new Error(j.error ?? "Save failed");
      setMsg("Saved — Alerts will use new thresholds.");
    } catch (e) {
      setMsg(e instanceof Error ? e.message : "Error");
    } finally {
      setSaving(false);
    }
  }

  function toggleMute(cat: string) {
    setS((prev) => ({
      ...prev,
      muted_categories: prev.muted_categories.includes(cat)
        ? prev.muted_categories.filter((c) => c !== cat)
        : [...prev.muted_categories, cat],
    }));
  }

  return (
    <div className="space-y-4">
      <div>
        <h1 className="font-[family-name:var(--font-display)] text-3xl tracking-tight">Settings</h1>
        <p className="mt-1 text-sm text-white/50">You define unusual. Persist to Supabase.</p>
      </div>

      <Card className="space-y-4">
        <label className="block text-xs text-white/50">
          Volume multiple · {s.vol_multiple.toFixed(1)}×
          <input
            type="range"
            min={1.2}
            max={5}
            step={0.1}
            value={s.vol_multiple}
            onChange={(e) => setS({ ...s, vol_multiple: Number(e.target.value) })}
            className="mt-2 w-full accent-[var(--signal)]"
          />
        </label>
        <label className="block text-xs text-white/50">
          Price move · ±{s.price_pct.toFixed(1)}%
          <input
            type="range"
            min={1}
            max={10}
            step={0.5}
            value={s.price_pct}
            onChange={(e) => setS({ ...s, price_pct: Number(e.target.value) })}
            className="mt-2 w-full accent-[var(--signal)]"
          />
        </label>
        <label className="block text-xs text-white/50">
          Digest / alert window (hours) · {s.window_hours}
          <input
            type="range"
            min={24}
            max={720}
            step={24}
            value={s.window_hours}
            onChange={(e) => setS({ ...s, window_hours: Number(e.target.value) })}
            className="mt-2 w-full accent-[var(--signal)]"
          />
        </label>
      </Card>

      <Card>
        <p className="text-[10px] uppercase tracking-[0.14em] text-[var(--signal)]">Muted categories</p>
        <div className="mt-3 flex flex-wrap gap-1.5">
          {CATEGORIES.map((c) => {
            const muted = s.muted_categories.includes(c);
            return (
              <button
                key={c}
                type="button"
                onClick={() => toggleMute(c)}
                className={`rounded-md px-2 py-1 text-xs ${muted ? "bg-rose-400/20 text-rose-100" : "bg-white/8 text-white/70"}`}
              >
                {c}
              </button>
            );
          })}
        </div>
      </Card>

      <Button className="w-full" onClick={() => void save()} disabled={saving}>
        {saving ? "Saving…" : "Save settings"}
      </Button>
      {msg && <p className="text-sm text-white/60">{msg}</p>}
    </div>
  );
}
