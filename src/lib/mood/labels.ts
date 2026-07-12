import type { MoodLevel } from "@/types/domain";

export const MOOD_LABELS: Record<MoodLevel, string> = {
  great: "Отлично",
  good: "Хорошо",
  neutral: "Спокойно",
  low: "Грустно",
  hard: "Тяжело",
};

export const MOOD_EMOJI: Record<MoodLevel, string> = {
  great: "✨",
  good: "🙂",
  neutral: "😐",
  low: "😔",
  hard: "💙",
};
