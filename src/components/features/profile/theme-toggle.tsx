"use client";

import { Moon, Sun } from "lucide-react";
import { useTheme } from "@/components/providers/theme-provider";

export function ThemeToggle() {
  const { theme, toggleTheme } = useTheme();

  return (
    <button
      className="flex w-full items-center justify-between rounded-2xl border border-[var(--border)] bg-[var(--surface)] px-4 py-3"
      onClick={toggleTheme}
      type="button"
    >
      <span className="font-semibold">Тема оформления</span>
      <span className="inline-flex items-center gap-2 text-sm text-[var(--muted)]">
        {theme === "dark" ? (
          <>
            <Moon aria-hidden className="size-4" /> Тёмная
          </>
        ) : (
          <>
            <Sun aria-hidden className="size-4" /> Светлая
          </>
        )}
      </span>
    </button>
  );
}
