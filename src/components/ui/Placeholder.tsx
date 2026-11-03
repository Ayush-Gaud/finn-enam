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
        <h1 className="heading text-3xl">{title}</h1>
        <p className="mt-1 text-sm text-[var(--secondary)]">{body}</p>
      </div>
      <Card>
        <p className="label !text-[var(--accent)]">Coming next</p>
        <p className="mt-2 text-sm leading-relaxed text-[var(--secondary)]">{next}</p>
      </Card>
    </div>
  );
}
