"use client";

type Option<T extends string> = { id: T; label: string };

export function Segmented<T extends string>({
  options,
  value,
  onChange,
}: {
  options: Option<T>[];
  value: T;
  onChange: (v: T) => void;
}) {
  return (
    <div className="glass flex gap-1 !rounded-xl p-1">
      {options.map((o) => {
        const active = o.id === value;
        return (
          <button
            key={o.id}
            type="button"
            onClick={() => onChange(o.id)}
            className={`relative z-[2] min-h-11 flex-1 rounded-[10px] px-2 text-sm font-semibold transition duration-200 ease-out ${
              active
                ? "accent-gradient text-[#0A0A0F] shadow-[0_4px_14px_rgba(245,166,35,0.3)]"
                : "text-[var(--secondary)] hover:bg-[var(--glass-elevated)] hover:text-[var(--text)]"
            }`}
          >
            {o.label}
          </button>
        );
      })}
    </div>
  );
}
