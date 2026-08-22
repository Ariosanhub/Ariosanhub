"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, NotebookPen, MessageCircle, GraduationCap, BarChart3 } from "lucide-react";
import { cn } from "@/lib/utils";

const TABS = [
  { href: "/", label: "Início", icon: Home },
  { href: "/journal", label: "Diário", icon: NotebookPen },
  { href: "/chat", label: "Nina", icon: MessageCircle },
  { href: "/lessons", label: "Lições", icon: GraduationCap },
  { href: "/dashboard", label: "Painel", icon: BarChart3 },
];

export function BottomNav() {
  const pathname = usePathname();

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-40 border-t border-[var(--border)] bg-[var(--bg-elevated)]/95 backdrop-blur pb-[env(safe-area-inset-bottom)]">
      <div className="mx-auto flex max-w-md items-stretch justify-between px-2">
        {TABS.map(({ href, label, icon: Icon }) => {
          const active = href === "/" ? pathname === "/" : pathname.startsWith(href);
          return (
            <Link
              key={href}
              href={href}
              className={cn(
                "flex flex-1 flex-col items-center gap-1 py-2.5 text-[11px] font-medium transition-colors",
                active ? "text-[var(--accent)]" : "text-[var(--fg-muted)]"
              )}
            >
              <Icon size={20} strokeWidth={active ? 2.4 : 1.8} />
              {label}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
