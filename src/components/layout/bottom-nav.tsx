"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { MessageCircle } from "lucide-react";

const sideLinks = [
  { href: "/dashboard", label: "Главная" },
  { href: "/plans", label: "Планы" },
  { href: "/memories", label: "Моменты" },
  { href: "/profile", label: "Профиль" },
] as const;

export function BottomNav() {
  const pathname = usePathname();
  const isChatActive = pathname === "/chat";

  return (
    <nav className="fixed bottom-[max(1rem,env(safe-area-inset-bottom))] left-1/2 flex w-[calc(100%-2rem)] max-w-md -translate-x-1/2 items-end justify-between rounded-3xl border border-[var(--border)] bg-white/95 px-3 py-3 text-sm shadow-lg backdrop-blur">
      {sideLinks.slice(0, 2).map((link) => (
        <Link
          className={`min-h-11 min-w-11 px-2 py-2 text-center ${
            pathname === link.href ? "font-semibold text-[var(--accent)]" : ""
          }`}
          href={link.href}
          key={link.href}
        >
          {link.label}
        </Link>
      ))}

      <Link
        aria-label="Чат"
        className={`grid size-14 -translate-y-3 place-items-center rounded-full shadow-lg transition-transform ${
          isChatActive
            ? "bg-[var(--accent)] text-white ring-4 ring-[var(--accent-soft)]"
            : "bg-[var(--accent)] text-white hover:scale-105"
        }`}
        href="/chat"
      >
        <MessageCircle aria-hidden className="size-7" strokeWidth={2.2} />
      </Link>

      {sideLinks.slice(2).map((link) => (
        <Link
          className={`min-h-11 min-w-11 px-2 py-2 text-center ${
            pathname === link.href ? "font-semibold text-[var(--accent)]" : ""
          }`}
          href={link.href}
          key={link.href}
        >
          {link.label}
        </Link>
      ))}
    </nav>
  );
}
