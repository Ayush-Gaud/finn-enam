import type { ButtonHTMLAttributes, ReactNode } from "react";

type Props = ButtonHTMLAttributes<HTMLButtonElement> & {
  children: ReactNode;
  variant?: "primary" | "ghost" | "outline";
};

const styles: Record<NonNullable<Props["variant"]>, string> = {
  primary: "bg-[var(--signal)] text-[var(--ink)] hover:opacity-90",
  ghost: "bg-transparent text-white/70 hover:bg-white/8 hover:text-white",
  outline: "border border-white/20 bg-transparent text-white/80 hover:border-white/40",
};

export function Button({ children, variant = "primary", className = "", ...rest }: Props) {
  return (
    <button
      type="button"
      className={`inline-flex items-center justify-center rounded-lg px-3 py-2 text-sm font-medium transition disabled:opacity-50 ${styles[variant]} ${className}`}
      {...rest}
    >
      {children}
    </button>
  );
}
