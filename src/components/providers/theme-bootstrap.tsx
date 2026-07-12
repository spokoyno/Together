"use client";

import { useEffect } from "react";
import { getThemePreference } from "@/lib/profile/theme";
import { useTheme } from "@/components/providers/theme-provider";

export function ThemeBootstrap() {
  const { setTheme } = useTheme();

  useEffect(() => {
    let cancelled = false;

    void getThemePreference().then((stored) => {
      if (cancelled || !stored) {
        return;
      }

      setTheme(stored);
    });

    return () => {
      cancelled = true;
    };
  }, [setTheme]);

  return null;
}
