export type QuarterNums = {
  revenue: number | null;
  ebitda: number | null;
  pbt: number | null;
  pat: number | null;
};

export function pctChange(latest: number | null, base: number | null): number | null {
  if (latest == null || base == null || base === 0) return null;
  return ((latest - base) / Math.abs(base)) * 100;
}

export function qoqYoy(latest: QuarterNums, previous: QuarterNums, yearAgo: QuarterNums) {
  const keys = ["revenue", "ebitda", "pbt", "pat"] as const;
  const qoq: Record<string, number | null> = {};
  const yoy: Record<string, number | null> = {};
  for (const k of keys) {
    qoq[k] = pctChange(latest[k], previous[k]);
    yoy[k] = pctChange(latest[k], yearAgo[k]);
  }
  return { qoq, yoy };
}

export function isUnusualVolume(
  volume: number,
  avgVol20d: number | null | undefined,
  volMultiple: number,
): boolean {
  if (!avgVol20d || avgVol20d <= 0) return false;
  return volume > volMultiple * avgVol20d;
}

export function isUnusualPrice(pctChange1d: number | null | undefined, pricePct: number): boolean {
  if (pctChange1d == null) return false;
  return Math.abs(pctChange1d) >= pricePct;
}

/** Parse simple table-style results text when LLM unavailable. */
export function parseResultsFromRaw(raw: string): {
  period: string;
  unit: string;
  latest: QuarterNums;
  previous: QuarterNums;
  yearAgo: QuarterNums;
} | null {
  const lines = raw.split(/\r?\n/).map((l) => l.trim()).filter(Boolean);
  const find = (label: string): [number, number, number] | null => {
    const re = new RegExp(`${label}[^0-9]*([0-9][0-9,]*(?:\\.[0-9]+)?)[^0-9]+([0-9][0-9,]*(?:\\.[0-9]+)?)[^0-9]+([0-9][0-9,]*(?:\\.[0-9]+)?)`, "i");
    for (const line of lines) {
      const m = line.replace(/,/g, "").match(re);
      if (m) return [Number(m[1]), Number(m[2]), Number(m[3])];
    }
    return null;
  };
  const revenue = find("Revenue");
  const ebitda = find("EBITDA");
  const pbt = find("PBT|Profit before tax");
  const pat = find("PAT|Profit after tax");
  if (!revenue && !pat) return null;
  const pack = (triple: [number, number, number] | null, i: 0 | 1 | 2) =>
    triple ? triple[i] : null;
  return {
    period: (raw.match(/Q[1-4]\s*FY\d{2}/i) || ["Q2 FY26"])[0],
    unit: "₹ cr",
    latest: {
      revenue: pack(revenue, 0),
      ebitda: pack(ebitda, 0),
      pbt: pack(pbt, 0),
      pat: pack(pat, 0),
    },
    previous: {
      revenue: pack(revenue, 1),
      ebitda: pack(ebitda, 1),
      pbt: pack(pbt, 1),
      pat: pack(pat, 1),
    },
    yearAgo: {
      revenue: pack(revenue, 2),
      ebitda: pack(ebitda, 2),
      pbt: pack(pbt, 2),
      pat: pack(pat, 2),
    },
  };
}
