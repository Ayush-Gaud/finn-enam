import type { LucideIcon } from "lucide-react";
import {
  BadgeCheck,
  FileText,
  Factory,
  Gavel,
  GitMerge,
  Landmark,
  Lock,
  Megaphone,
  Phone,
  TrendingUp,
  UserRoundCog,
  Coins,
} from "lucide-react";

export type Sentiment = "positive" | "negative" | "neutral";

const NEGATIVE = new Set([
  "litigation",
  "pledging",
  "credit_rating",
  "insider_trading",
]);

const POSITIVE = new Set([
  "results",
  "press_release",
  "dividend",
  "bonus_split",
  "fund_raise",
  "capex",
]);

export function sentimentForCategory(category: string): Sentiment {
  if (NEGATIVE.has(category)) return "negative";
  if (POSITIVE.has(category)) return "positive";
  return "neutral";
}

export function sentimentAccent(s: Sentiment): {
  rule: string;
  soft: string;
  text: string;
  dot: string;
} {
  if (s === "positive") {
    return {
      rule: "var(--up)",
      soft: "var(--up-soft)",
      text: "var(--up)",
      dot: "bg-[var(--up)]",
    };
  }
  if (s === "negative") {
    return {
      rule: "var(--down)",
      soft: "var(--down-soft)",
      text: "var(--down)",
      dot: "bg-[var(--down)]",
    };
  }
  return {
    rule: "var(--neutral)",
    soft: "var(--neutral-soft)",
    text: "var(--neutral)",
    dot: "bg-[var(--neutral)]",
  };
}

const ICONS: Record<string, LucideIcon> = {
  litigation: Gavel,
  press_release: Megaphone,
  management_change: UserRoundCog,
  results: TrendingUp,
  "M&A": GitMerge,
  fund_raise: Landmark,
  dividend: Coins,
  capex: Factory,
  earnings_call: Phone,
  credit_rating: BadgeCheck,
  pledging: Lock,
};

export function categoryIcon(category: string): LucideIcon {
  return ICONS[category] ?? FileText;
}
