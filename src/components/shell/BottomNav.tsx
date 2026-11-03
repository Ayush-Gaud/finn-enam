"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Bell, BookOpen, Newspaper, Settings } from "lucide-react";

const TABS = [
  { href: "/feed", label: "Feed", Icon: Newspaper },
  { href: "/alerts", label: "Alerts", Icon: Bell },
  { href: "/research", label: "Research", Icon: BookOpen },
  { href: "/settings", label: "Settings", Icon: Settings },
] as const;

export function BottomNav() {
  const pathname = usePathname();

  return (
    <nav
      className="glass glass-bar fixed inset-x-0 bottom-0 z-30 mx-auto max-w-md !rounded-t-2xl !rounded-b-none"
      style={{ paddingBottom: "max(0.35rem, env(safe-area-inset-bottom))" }}
    >
      <div className="relative z-[2] grid grid-cols-4 px-1.5 pt-1.5">
        {TABS.map(({ href, label, Icon }) => {
          const active = pathname === href || pathname.startsWith(`${href}/`);
          return (
            <Link
              key={href}
              href={href}
              className={`flex min-h-11 flex-col items-center justify-center gap-0.5 rounded-xl text-[11px] font-medium transition duration-200 ease-out ${
                active ? "text-[var(--text)]" : "text-[var(--muted)] hover:text-[var(--secondary)]"
              }`}
            >
              <span
                className={`flex h-7 w-7 items-center justify-center rounded-lg transition duration-200 ${
                  active ? "accent-gradient text-[#0A0A0F] shadow-[0_4px_12px_rgba(245,166,35,0.35)]" : ""
                }`}
              >
                <Icon strokeWidth={1.75} className="h-[16px] w-[16px]" />
              </span>
              <span className={active ? "accent-text font-semibold" : ""}>{label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
