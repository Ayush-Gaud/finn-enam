export function Sparkline({ values }: { values: Array<number | null | undefined> }) {
  const cleaned = values.map((v) => (v == null ? 0 : v));
  const max = Math.max(...cleaned.map(Math.abs), 1);
  const w = 44;
  const h = 16;
  const pts = cleaned
    .map((v, i) => {
      const x = (i / Math.max(cleaned.length - 1, 1)) * w;
      const y = h / 2 - (v / max) * (h / 2 - 1);
      return `${x},${y}`;
    })
    .join(" ");
  const last = cleaned[cleaned.length - 1] ?? 0;
  return (
    <svg width={w} height={h} viewBox={`0 0 ${w} ${h}`} aria-hidden>
      <polyline
        fill="none"
        stroke={last >= 0 ? "var(--up)" : "var(--down)"}
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
        points={pts}
      />
    </svg>
  );
}
