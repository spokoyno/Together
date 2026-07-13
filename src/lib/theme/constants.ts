export const THEME_STORAGE_KEY = "together-theme";
export const THEME_COOKIE_NAME = "together-theme";

export const COLOR_PALETTES = ["pink", "blue", "purple", "emerald", "amber"] as const;

export type ColorPalette = (typeof COLOR_PALETTES)[number];

export const DEFAULT_COLOR_PALETTE: ColorPalette = "pink";

export function isColorPalette(value: string | null | undefined): value is ColorPalette {
  return COLOR_PALETTES.includes(value as ColorPalette);
}

export function normalizeColorPalette(value: string | null | undefined): ColorPalette {
  if (value === "dark" || value === "light" || !value) {
    return DEFAULT_COLOR_PALETTE;
  }
  return isColorPalette(value) ? value : DEFAULT_COLOR_PALETTE;
}

export function themeCookieValue(palette: ColorPalette): string {
  return `${THEME_COOKIE_NAME}=${palette}; path=/; max-age=31536000; SameSite=Lax`;
}

export const PALETTE_LABELS: Record<ColorPalette, string> = {
  pink: "Rose",
  blue: "Ocean",
  purple: "Violet",
  emerald: "Forest",
  amber: "Gold",
};
