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
import { saveThemePreference } from "@/lib/profile/theme";
import type { ThemePreference } from "@/types/domain";

type Theme = ThemePreference;

type ThemeContextValue = {
  theme: Theme;
  setTheme: (theme: Theme) => void;
  toggleTheme: () => void;
};

const ThemeContext = createContext<ThemeContextValue | null>(null);

function readTheme(initialTheme?: Theme | null): Theme {
  if (typeof window === "undefined") {
    return initialTheme ?? "light";
  }

  return resolveClientTheme();
}

export function ThemeProvider({
  children,
  initialTheme,
}: {
  children: ReactNode;
  initialTheme?: Theme | null;
}) {
  const [theme, setThemeState] = useState<Theme>(() => readTheme(initialTheme));

  const setTheme = useCallback((next: Theme) => {
    setThemeState(next);
    persistThemeLocally(next);
    void saveThemePreference(next);
  }, []);

  const toggleTheme = useCallback(() => {
    setThemeState((current) => {
      const next = current === "dark" ? "light" : "dark";
      persistThemeLocally(next);
      void saveThemePreference(next);
      return next;
    });
  }, []);

  const value = useMemo(
    () => ({
      theme,
      setTheme,
      toggleTheme,
    }),
    [setTheme, theme, toggleTheme],
  );

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
