"use server";

import { revalidatePath } from "next/cache";
import type { SupabaseClient } from "@supabase/supabase-js";
import { getAuthContext } from "@/lib/couple/context.server";
import { todayIso } from "@/lib/dates";
import { createInAppNotification } from "@/lib/notifications/actions";
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

function addDays(isoDate: string, days: number): string {
  const date = new Date(`${isoDate}T00:00:00`);
  date.setDate(date.getDate() + days);
  return date.toISOString().slice(0, 10);
}

export async function ensureWeekQuestions(
  supabase: SupabaseClient,
  coupleId: string,
): Promise<void> {
  const today = todayIso();
  const weekDates = Array.from({ length: 7 }, (_, index) => addDays(today, index));

  const { data: existing } = await supabase
    .from("daily_questions")
    .select("question_date, question_id")
    .eq("couple_id", coupleId)
    .in("question_date", weekDates);

  const existingDates = new Set((existing ?? []).map((row) => row.question_date));
  const usedQuestionIds = new Set((existing ?? []).map((row) => row.question_id));

  const { data: questions } = await supabase
    .from("questions")
    .select("id")
    .eq("is_active", true)
    .limit(100);

  if (!questions?.length) {
    return;
  }

  const missingDates = weekDates.filter((date) => !existingDates.has(date));
  if (!missingDates.length) {
    return;
  }

  const available = questions.filter((question) => !usedQuestionIds.has(question.id));
  const pool = available.length ? available : questions;

  for (const [index, questionDate] of missingDates.entries()) {
    const question = pool[index % pool.length]!;
    const { error } = await supabase.from("daily_questions").insert({
      couple_id: coupleId,
      question_id: question.id,
      question_date: questionDate,
    });

    if (!error) {
      usedQuestionIds.add(question.id);
    }
  }
}

export async function getTodayDailyQuestion(
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

  return null;
}

export async function getOrCreateDailyQuestion(
  supabase: SupabaseClient,
  coupleId: string,
): Promise<DailyQuestion | null> {
  await ensureWeekQuestions(supabase, coupleId);

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

  const randomQuestion = questions[Math.floor(Math.random() * questions.length)]!;

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

  const { data: existingAnswer } = await supabase
    .from("answers")
    .select("id")
    .eq("daily_question_id", parsed.data.dailyQuestionId)
    .eq("user_id", user.id)
    .maybeSingle();

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

  if (existingAnswer) {
    revalidatePath("/question");
    revalidatePath("/dashboard");
    return;
  }

  const { data: dailyQuestion } = await supabase
    .from("daily_questions")
    .select("id, questions(prompt)")
    .eq("id", parsed.data.dailyQuestionId)
    .eq("couple_id", context.coupleId)
    .maybeSingle();

  const question = dailyQuestion?.questions as
    | { prompt: string }
    | { prompt: string }[]
    | null
    | undefined;
  const prompt = Array.isArray(question) ? question[0]?.prompt : question?.prompt;

  await supabase.from("partner_facts").insert({
    couple_id: context.coupleId,
    target_user_id: user.id,
    author_id: user.id,
    trait: prompt ? prompt.slice(0, 80) : "Вопрос дня",
    description: parsed.data.answer.slice(0, 200),
  });

  const partnerId = context.partner?.id;
  if (partnerId) {
    const { data: profile } = await supabase
      .from("profiles")
      .select("display_name")
      .eq("id", user.id)
      .maybeSingle();

    await createInAppNotification({
      supabase,
      coupleId: context.coupleId,
      userId: partnerId,
      type: "daily_answer",
      title: "Партнёр ответил на вопрос дня",
      body: `${profile?.display_name ?? "Партнёр"} уже ответил — ваш ответ откроет его.`,
      linkPath: "/question",
      referenceId: parsed.data.dailyQuestionId,
    });
  }

  revalidatePath("/question");
  revalidatePath("/dashboard");
  revalidatePath("/profile/partner");
}
