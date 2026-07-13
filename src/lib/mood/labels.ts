import type { MoodLevel } from "@/types/domain";

export const MOOD_LABELS: Record<MoodLevel, string> = {
  great: "Отличное",
  good: "Хорошее",
  neutral: "Нормальное",
  irritated: "Раздражённое",
  low: "Грустное",
  hard: "Тяжело",
};

export const MOOD_EMOJI: Record<MoodLevel, string> = {
  great: "✨",
  good: "🙂",
  neutral: "😐",
  irritated: "😤",
  low: "😔",
  hard: "💙",
};

export const DASHBOARD_MOODS: MoodLevel[] = [
  "great",
  "good",
  "neutral",
  "irritated",
  "low",
];
