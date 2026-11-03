import { Card } from "@/components/ui/Card";

export function Placeholder({
  title,
  body,
  next,
}: {
  title: string;
  body: string;
  next: string;
}) {
  return (
    <div className="space-y-4">
      <div>
        <h1 className="font-[family-name:var(--font-display)] text-3xl tracking-tight text-[var(--paper)]">
          {title}
        </h1>
        <p className="mt-1 text-sm text-white/50">{body}</p>
      </div>
      <Card>
        <p className="text-[10px] uppercase tracking-[0.16em] text-[var(--signal)]">Coming next</p>
        <p className="mt-2 text-sm leading-relaxed text-white/70">{next}</p>
      </Card>
    </div>
  );
}
