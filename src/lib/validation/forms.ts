import { z } from "zod";
import type { MoodLevel, ProfileGender } from "@/types/domain";

const moodLevels = ["great", "good", "neutral", "low", "hard", "irritated"] as const satisfies readonly MoodLevel[];
const profileGenders = ["female", "male", "other"] as const satisfies readonly ProfileGender[];

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
  remindEnabled: z.coerce.boolean().optional(),
  isSurprise: z.coerce.boolean().optional(),
});

export const momentTypeSchema = z.enum(["memory", "movie", "cooking", "photo"]);

export const memorySchema = z.object({
  title: z.string().trim().max(160).optional(),
  body: z.string().trim().max(4000).optional(),
  happenedOn: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  tags: z.string().trim().max(200).optional(),
  momentType: momentTypeSchema.default("memory"),
  meta: z.string().optional(),
  mediaPath: z.string().trim().optional(),
});

export const nicknameSchema = z.object({
  nickname: z.string().trim().min(1).max(40),
  targetUserId: z.string().uuid(),
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
  gender: z.enum(profileGenders).optional(),
  relationshipStartedOn: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/)
    .optional(),
});

export const onboardingProfileSchema = z.object({
  displayName: z.string().trim().min(1).max(80),
  birthday: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Укажите корректную дату рождения."),
  gender: z.enum(profileGenders, { message: "Выберите пол." }),
});

export const messageSchema = z
  .object({
    body: z.string().trim().max(2000).optional(),
    imagePath: z.string().trim().optional(),
  })
  .refine(
    (value) => Boolean(value.body && value.body.length > 0) || Boolean(value.imagePath),
    { message: "Напишите сообщение или прикрепите фото" },
  );

export const chatNoteSchema = z.object({
  body: z.string().trim().min(1, "Напишите заметку").max(2000, "Слишком длинная заметка"),
  messageId: z.string().uuid().optional(),
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
