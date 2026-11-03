export type Materiality = "high" | "medium" | "low";

const HIGH = new Set([
  "results",
  "M&A",
  "fund_raise",
  "management_change",
  "litigation",
  "credit_rating",
  "pledging",
  "insider_trading",
]);

const MID = new Set([
  "earnings_call",
  "investor_meetings",
  "capex",
  "dividend",
  "bonus_split",
  "press_release",
  "postal_ballot",
  "agm_egm",
]);

export function materialityForCategory(category: string): Materiality {
  if (HIGH.has(category)) return "high";
  if (MID.has(category)) return "medium";
  if (category === "unclassified") return "low";
  return "medium";
}

export function materialityRank(m: Materiality): number {
  return m === "high" ? 0 : m === "medium" ? 1 : 2;
}

export function isRoutine(category: string, materiality: Materiality): boolean {
  return category === "unclassified" || materiality === "low";
}
