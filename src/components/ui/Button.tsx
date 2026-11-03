import type { ButtonHTMLAttributes, ReactNode } from "react";

type Props = ButtonHTMLAttributes<HTMLButtonElement> & {
  children: ReactNode;
  variant?: "accent" | "soft" | "ghost" | "outline";
};

const variants: Record<NonNullable<Props["variant"]>, string> = {
  accent:
    "accent-gradient text-[#0A0A0F] shadow-[0_6px_20px_rgba(245,166,35,0.28)] hover:brightness-110 active:scale-[0.98]",
  soft: "bg-[var(--accent-soft)] text-[var(--accent)] hover:bg-[rgba(245,166,35,0.22)]",
  ghost: "bg-transparent text-[var(--secondary)] hover:bg-[var(--glass-elevated)] hover:text-[var(--text)]",
  outline:
    "glass glass-elevated text-[var(--text)] hover:bg-[var(--glass-strong)] active:scale-[0.98]",
};

export function Button({ children, variant = "accent", className = "", ...rest }: Props) {
  return (
    <button
      type="button"
      className={`inline-flex min-h-11 items-center justify-center gap-2 rounded-xl px-4 text-sm font-semibold transition duration-200 ease-out disabled:opacity-45 ${variants[variant]} ${className}`}
      {...rest}
    >
      {children}
    </button>
  );
}
