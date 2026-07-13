import { z } from "zod";
import { COLOR_PALETTES } from "@/lib/theme/constants";

export const themePreferenceSchema = z.enum(COLOR_PALETTES);

export type ThemePreferenceInput = z.infer<typeof themePreferenceSchema>;
