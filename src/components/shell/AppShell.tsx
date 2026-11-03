import type { ReactNode } from "react";
import { BottomNav } from "@/components/shell/BottomNav";

export function AppShell({ children }: { children: ReactNode }) {
  return (
    <div className="relative mx-auto flex min-h-full w-full max-w-md flex-col text-[var(--text)]">
      <div className="mesh-layer" aria-hidden />

      <header
        className="glass glass-bar sticky top-0 z-20 !rounded-none border-b border-transparent"
        style={{ paddingTop: "max(0.65rem, env(safe-area-inset-top))" }}
      >
        <div className="relative z-[2] flex items-center justify-between px-4 pb-3">
          <div className="flex items-baseline gap-2">
            <h1 className="heading text-[1.35rem] font-bold tracking-[-0.03em]">FINN</h1>
            <span className="label">Terminal</span>
          </div>
          <div className="flex min-h-11 items-center gap-2 rounded-full bg-[var(--glass-elevated)] py-1.5 pr-3 pl-1.5 shadow-[inset_0_0_0_1px_var(--hairline)]">
            <span className="accent-gradient flex h-7 w-7 items-center justify-center rounded-full text-[10px] font-bold tracking-wide text-[#0A0A0F]">
              EH
            </span>
            <span className="text-[11px] font-semibold tracking-[0.06em] text-[var(--secondary)] uppercase">
              ENAM
            </span>
          </div>
        </div>
      </header>

      <main
        className="relative z-[1] flex-1 px-4 py-4"
        style={{ paddingBottom: "max(5.75rem, calc(4.75rem + env(safe-area-inset-bottom)))" }}
      >
        {children}
      </main>

      <BottomNav />
    </div>
  );
}
