import { z } from "zod";

export const themePreferenceSchema = z.enum(["light", "dark"]);

export type ThemePreferenceInput = z.infer<typeof themePreferenceSchema>;
