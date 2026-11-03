import { ArrowDownRight, ArrowUpRight, Minus } from "lucide-react";

export function Delta({ value, suffix = "%" }: { value: number | null | undefined; suffix?: string }) {
  if (value == null || Number.isNaN(value)) {
    return <span className="tabular text-[var(--muted)]">—</span>;
  }
  const up = value > 0;
  const flat = value === 0;
  const Icon = flat ? Minus : up ? ArrowUpRight : ArrowDownRight;
  const cls = flat
    ? "bg-[var(--elevated)] text-[var(--secondary)]"
    : up
      ? "bg-[var(--up-soft)] text-[var(--up)]"
      : "bg-[var(--down-soft)] text-[var(--down)]";
  const sign = up ? "+" : "";
  return (
    <span className={`inline-flex items-center gap-0.5 rounded-full px-1.5 py-0.5 tabular text-[11px] font-medium ${cls}`}>
      <Icon className="h-3 w-3" strokeWidth={2} />
      {sign}
      {Math.abs(value).toFixed(1)}
      {suffix}
    </span>
  );
}
