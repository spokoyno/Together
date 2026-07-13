"use client";

import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { applyThemeToDocument, persistThemeLocally, resolveClientTheme } from "@/lib/theme/client";
import {
  DEFAULT_COLOR_PALETTE,
  type ColorPalette,
  normalizeColorPalette,
} from "@/lib/theme/constants";
import { saveThemePreference } from "@/lib/profile/theme";

type ThemeContextValue = {
  palette: ColorPalette;
  setPalette: (palette: ColorPalette) => void;
};

const ThemeContext = createContext<ThemeContextValue | null>(null);

function readPalette(initialPalette?: ColorPalette | null): ColorPalette {
  if (typeof window === "undefined") {
    return normalizeColorPalette(initialPalette ?? DEFAULT_COLOR_PALETTE);
  }

  return resolveClientTheme();
}

export function ThemeProvider({
  children,
  initialPalette,
}: {
  children: ReactNode;
  initialPalette?: ColorPalette | null;
}) {
  const [palette, setPaletteState] = useState<ColorPalette>(() => readPalette(initialPalette));

  const setPalette = useCallback((next: ColorPalette) => {
    const normalized = normalizeColorPalette(next);
    setPaletteState(normalized);
    persistThemeLocally(normalized);
    void saveThemePreference(normalized);
  }, []);

  const value = useMemo(() => ({ palette, setPalette }), [palette, setPalette]);

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error("useTheme must be used within ThemeProvider");
  }
  return context;
}

export { applyThemeToDocument as applyTheme };
