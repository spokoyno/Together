"use client";

import { useTheme } from "@/components/providers/theme-provider";
import { useLanguage } from "@/components/providers/language-provider";
import {
  COLOR_PALETTES,
  PALETTE_LABELS,
} from "@/lib/theme/constants";

export function PalettePicker() {
  const { palette, setPalette } = useTheme();
  const { t } = useLanguage();

  return (
    <div className="rounded-3xl surface-panel p-5">
      <p className="font-semibold">{t("profileColorPalette")}</p>
      <div className="mt-3 grid grid-cols-5 gap-2">
        {COLOR_PALETTES.map((id) => (
          <button
            aria-label={PALETTE_LABELS[id]}
            aria-pressed={palette === id}
            className={`flex flex-col items-center gap-1.5 rounded-2xl px-1 py-2.5 transition-colors ${
              palette === id ? "bg-[var(--accent-soft)] ring-2 ring-[var(--accent)]" : "surface-input"
            }`}
            key={id}
            onClick={() => setPalette(id)}
            type="button"
          >
            <span
              className="size-6 rounded-full border border-[var(--border)]"
              data-palette={id}
              style={{
                background:
                  id === "pink"
                    ? "#ff5c8a"
                    : id === "blue"
                      ? "#4da3ff"
                      : id === "purple"
                        ? "#a78bfa"
                        : id === "emerald"
                          ? "#34d399"
                          : "#fbbf24",
              }}
            />
            <span className="text-[10px] font-medium leading-tight text-[var(--muted)]">
              {PALETTE_LABELS[id]}
            </span>
          </button>
        ))}
      </div>
    </div>
  );
}
