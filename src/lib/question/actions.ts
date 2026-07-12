"use server";

import { revalidatePath } from "next/cache";
import type { SupabaseClient } from "@supabase/supabase-js";
import { getAuthContext } from "@/lib/couple/context.server";
import { todayIso } from "@/lib/dates";
import {
  answerSchema,
  parseFormData,
} from "@/lib/validation/forms";

type DailyQuestionRow = {
  id: string;
  question_date: string;
  question_id: string;
  questions: { prompt: string } | { prompt: string }[] | null;
};

function normalizeDailyQuestion(row: DailyQuestionRow) {
  const question = Array.isArray(row.questions) ? row.questions[0] : row.questions;
  return { ...row, questions: question ?? null };
}

export type DailyQuestion = ReturnType<typeof normalizeDailyQuestion>;

export async function getOrCreateDailyQuestion(
  supabase: SupabaseClient,
  coupleId: string,
): Promise<DailyQuestion | null> {
  const today = todayIso();

  const { data: existing } = await supabase
    .from("daily_questions")
    .select("id, question_date, question_id, questions(prompt)")
    .eq("couple_id", coupleId)
    .eq("question_date", today)
    .maybeSingle();

  if (existing) {
    return normalizeDailyQuestion(existing as DailyQuestionRow);
  }

  const { data: questions } = await supabase
    .from("questions")
    .select("id")
    .eq("is_active", true)
    .limit(100);

  if (!questions?.length) {
    return null;
  }

  const randomQuestion = questions[Math.floor(Math.random() * questions.length)];

  const { data: created, error } = await supabase
    .from("daily_questions")
    .insert({
      couple_id: coupleId,
      question_id: randomQuestion.id,
      question_date: today,
    })
    .select("id, question_date, question_id, questions(prompt)")
    .single();

  if (error || !created) {
    return null;
  }

  return normalizeDailyQuestion(created as DailyQuestionRow);
}

export async function saveAnswer(formData: FormData): Promise<void> {
  const { supabase, user, context } = await getAuthContext();

  if (!context?.isComplete) {
    return;
  }

  const parsed = answerSchema.safeParse(parseFormData(formData));
  if (!parsed.success) {
    return;
  }

  const { error } = await supabase.from("answers").upsert(
    {
      daily_question_id: parsed.data.dailyQuestionId,
      user_id: user.id,
      answer: parsed.data.answer,
      updated_at: new Date().toISOString(),
    },
    { onConflict: "daily_question_id,user_id" },
  );

  if (error) {
    return;
  }

  revalidatePath("/question");
  revalidatePath("/dashboard");
}
