"use server";

import { revalidatePath } from "next/cache";
import { getAuthContext } from "@/lib/couple/context.server";
import { createInAppNotification } from "@/lib/notifications/actions";
import { actionError } from "@/lib/validation/forms";

export type PollQuestionInput = {
  prompt: string;
  allowsText: boolean;
  options: string[];
};

export async function createPartnerPoll(targetUserId: string, title: string, questions: PollQuestionInput[]) {
  const { supabase, user, context } = await getAuthContext();
  if (!context?.isComplete) {
    return actionError("Пара не подключена.");
  }

  if (!title.trim()) {
    return actionError("Укажите название опроса.");
  }

  if (!questions.length) {
    return actionError("Добавьте хотя бы один вопрос.");
  }

  const { data: poll, error } = await supabase
    .from("partner_polls")
    .insert({
      couple_id: context.coupleId,
      creator_id: user.id,
      target_user_id: targetUserId,
      title: title.trim(),
    })
    .select("id")
    .single();

  if (error || !poll) {
    return actionError("Не удалось создать опрос.");
  }

  for (const [index, question] of questions.entries()) {
    const { data: row, error: questionError } = await supabase
      .from("poll_questions")
      .insert({
        poll_id: poll.id,
        prompt: question.prompt.trim(),
        allows_text: question.allowsText || question.options.length === 0,
        sort_order: index,
      })
      .select("id")
      .single();

    if (questionError || !row) {
      return actionError("Не удалось сохранить вопросы.");
    }

    for (const [optionIndex, label] of question.options.entries()) {
      const trimmed = label.trim();
      if (!trimmed) {
        continue;
      }
      await supabase.from("poll_options").insert({
        question_id: row.id,
        label: trimmed,
        sort_order: optionIndex,
      });
    }
  }

  await createInAppNotification({
    supabase,
    coupleId: context.coupleId,
    userId: targetUserId,
    type: "poll_invite",
    title: "Новый опрос",
    body: title.trim(),
    linkPath: "/memories/polls",
    referenceId: poll.id,
  });

  revalidatePath("/memories/polls");
  revalidatePath("/profile");
  return { ok: true as const };
}

export async function submitPollAnswers(
  pollId: string,
  answers: Array<{ questionId: string; optionId?: string; textAnswer?: string }>,
) {
  const { supabase, user, context } = await getAuthContext();
  if (!context?.isComplete) {
    return actionError("Пара не подключена.");
  }

  for (const answer of answers) {
    const { error } = await supabase.from("poll_answers").upsert(
      {
        poll_id: pollId,
        question_id: answer.questionId,
        respondent_id: user.id,
        option_id: answer.optionId ?? null,
        text_answer: answer.textAnswer?.trim() || null,
      },
      { onConflict: "poll_id,question_id,respondent_id" },
    );

    if (error) {
      return actionError("Не удалось сохранить ответы.");
    }
  }

  await supabase
    .from("partner_polls")
    .update({ status: "completed", completed_at: new Date().toISOString() })
    .eq("id", pollId)
    .eq("couple_id", context.coupleId);

  revalidatePath("/memories/polls");
  return { ok: true as const };
}
