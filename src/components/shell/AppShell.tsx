import type { ReactNode } from "react";
import { BottomNav } from "@/components/shell/BottomNav";

export function AppShell({ children }: { children: ReactNode }) {
  return (
    <div className="mx-auto flex min-h-full w-full max-w-md flex-col bg-transparent text-[var(--paper)]">
      <header
        className="sticky top-0 z-20 border-b border-white/10 bg-[var(--ink)]/90 px-4 pb-3 backdrop-blur"
        style={{ paddingTop: "max(0.75rem, env(safe-area-inset-top))" }}
      >
        <div className="flex items-end justify-between gap-3">
          <div>
            <p className="font-[family-name:var(--font-display)] text-3xl tracking-tight text-[var(--signal)]">
              FINN
            </p>
            <p className="mt-0.5 text-xs text-white/50">Financial Investment Agent</p>
          </div>
          <span className="rounded-sm border border-white/15 px-2 py-1 text-[10px] uppercase tracking-[0.14em] text-white/40">
            ENAM
          </span>
        </div>
      </header>

      <main
        className="flex-1 px-4 py-4"
        style={{ paddingBottom: "max(5.5rem, calc(4.5rem + env(safe-area-inset-bottom)))" }}
      >
        {children}
      </main>

      <BottomNav />
    </div>
  );
}
