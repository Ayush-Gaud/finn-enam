"use client";

import { useEffect, useMemo, useState } from "react";
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

  const preview = useMemo(
    () =>
      `Would trigger on volume ≥ ${s.vol_multiple.toFixed(1)}× 20d avg, or |Δprice| ≥ ${s.price_pct.toFixed(1)}%, inside ${s.window_hours}h. Muted: ${
        s.muted_categories.length ? s.muted_categories.join(", ") : "none"
      }.`,
    [s],
  );

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
      if (!r.ok) throw new Error(typeof j.error === "string" ? j.error : "Save failed");
      setMsg("Saved. Alerts will use the new thresholds.");
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
        <h2 className="heading text-2xl">Settings</h2>
        <p className="mt-1 text-sm text-[var(--secondary)]">You define unusual.</p>
      </div>

      <Card className="space-y-5">
        <label className="relative z-[2] block">
          <div className="flex items-center justify-between">
            <span className="label !text-[var(--secondary)]">Volume multiple</span>
            <span className="tabular text-sm font-semibold accent-text">{s.vol_multiple.toFixed(1)}×</span>
          </div>
          <input
            type="range"
            min={1.2}
            max={5}
            step={0.1}
            value={s.vol_multiple}
            onChange={(e) => setS({ ...s, vol_multiple: Number(e.target.value) })}
            className="mt-3 w-full"
          />
        </label>
        <label className="relative z-[2] block">
          <div className="flex items-center justify-between">
            <span className="label !text-[var(--secondary)]">Price move</span>
            <span className="tabular text-sm font-semibold accent-text">±{s.price_pct.toFixed(1)}%</span>
          </div>
          <input
            type="range"
            min={1}
            max={10}
            step={0.5}
            value={s.price_pct}
            onChange={(e) => setS({ ...s, price_pct: Number(e.target.value) })}
            className="mt-3 w-full"
          />
        </label>
        <label className="relative z-[2] block">
          <div className="flex items-center justify-between">
            <span className="label !text-[var(--secondary)]">Window</span>
            <span className="tabular text-sm font-semibold accent-text">{s.window_hours}h</span>
          </div>
          <input
            type="range"
            min={24}
            max={720}
            step={24}
            value={s.window_hours}
            onChange={(e) => setS({ ...s, window_hours: Number(e.target.value) })}
            className="mt-3 w-full"
          />
        </label>
      </Card>

      <div>
        <p className="label mb-2">Muted categories</p>
        <div className="flex flex-wrap gap-2">
          {CATEGORIES.map((c) => {
            const muted = s.muted_categories.includes(c);
            return (
              <button
                key={c}
                type="button"
                onClick={() => toggleMute(c)}
                className={`min-h-11 rounded-full px-3 text-xs font-medium transition duration-200 ${
                  muted
                    ? "bg-[var(--down-soft)] text-[var(--down)] shadow-[inset_0_0_0_1px_rgba(244,63,94,0.25)]"
                    : "glass relative text-[var(--secondary)] hover:text-[var(--text)]"
                }`}
              >
                <span className="relative z-[2]">{c}</span>
              </button>
            );
          })}
        </div>
      </div>

      <Card>
        <p className="relative z-[2] label accent-text !bg-clip-text">What would trigger now</p>
        <p className="relative z-[2] mt-2 text-sm leading-relaxed text-[var(--secondary)]">{preview}</p>
      </Card>

      <Button className="w-full" onClick={() => void save()} disabled={saving}>
        {saving ? "Saving…" : "Save settings"}
      </Button>
      {msg && <p className="text-sm text-[var(--secondary)]">{msg}</p>}
    </div>
  );
}
