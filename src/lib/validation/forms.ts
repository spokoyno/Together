import { z } from "zod";
import type { MoodLevel } from "@/types/domain";

const moodLevels = ["great", "good", "neutral", "low", "hard"] as const satisfies readonly MoodLevel[];

export const createCoupleSchema = z.object({
  relationshipStartedOn: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, "Укажите дату"),
});

export const moodSchema = z.object({
  level: z.enum(moodLevels),
  energy: z.coerce.number().int().min(1).max(5).optional(),
  note: z.string().trim().max(500).optional(),
});

export const planSchema = z.object({
  title: z.string().trim().min(1).max(160),
  details: z.string().trim().max(2000).optional(),
  category: z.string().trim().min(1).max(40).default("other"),
  dueAt: z.string().optional(),
});

export const memorySchema = z.object({
  title: z.string().trim().max(160).optional(),
  body: z.string().trim().max(4000).optional(),
  happenedOn: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  tags: z.string().trim().max(200).optional(),
});

export const eventSchema = z.object({
  title: z.string().trim().min(1).max(160),
  startsAt: z.string().min(1),
});

export const answerSchema = z.object({
  dailyQuestionId: z.string().uuid(),
  answer: z.string().trim().min(1).max(2000),
});

export const profileSchema = z.object({
  displayName: z.string().trim().min(1).max(80),
  relationshipStartedOn: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/)
    .optional(),
});

export function parseFormData(formData: FormData): Record<string, string> {
  const result: Record<string, string> = {};
  for (const [key, value] of formData.entries()) {
    if (typeof value === "string") {
      result[key] = value;
    }
  }
  return result;
}

export function actionError(message: string): { ok: false; error: string } {
  return { ok: false, error: message };
}

export function actionSuccess(): { ok: true } {
  return { ok: true };
}
