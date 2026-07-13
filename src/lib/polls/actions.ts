"use server";

import { revalidatePath } from "next/cache";
import { getAuthContext } from "@/lib/couple/context.server";
import { createInAppNotification } from "@/lib/notifications/actions";
import { actionError } from "@/lib/validation/forms";

export type PollOptionInput = {
  label: string;
  isCorrect: boolean;
};

export type PollQuestionInput = {
  prompt: string;
  allowsText: boolean;
  options: PollOptionInput[];
};

export type PollQuestionResult = {
  questionId: string;
  prompt: string;
  isCorrect: boolean | null;
  chosenOptionId: string | null;
  chosenOptionLabel: string | null;
  chosenTextAnswer: string | null;
  correctOptionLabels: string[];
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

  for (const question of questions) {
    const isMcq = !question.allowsText && question.options.length > 0;
    if (isMcq) {
      const validOptions = question.options.filter((option) => option.label.trim());
      if (validOptions.length < 2) {
        return actionError("Добавьте минимум два варианта ответа.");
      }
      if (!validOptions.some((option) => option.isCorrect)) {
        return actionError("Отметьте хотя бы один правильный вариант.");
      }
    }
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

    for (const [optionIndex, option] of question.options.entries()) {
      const trimmed = option.label.trim();
      if (!trimmed) {
        continue;
      }
      await supabase.from("poll_options").insert({
        question_id: row.id,
        label: trimmed,
        sort_order: optionIndex,
        is_correct: option.isCorrect,
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

  const { data: poll, error: pollError } = await supabase
    .from("partner_polls")
    .select("id, title, status, creator_id, target_user_id")
    .eq("id", pollId)
    .eq("couple_id", context.coupleId)
    .maybeSingle();

  if (pollError || !poll) {
    return actionError("Опрос не найден.");
  }

  if (poll.status !== "pending") {
    return actionError("Этот опрос уже пройден.");
  }

  if (poll.target_user_id !== user.id) {
    return actionError("Ответить может только получатель опроса.");
  }

  const { data: questions, error: questionsError } = await supabase
    .from("poll_questions")
    .select("id, prompt, allows_text, sort_order")
    .eq("poll_id", pollId)
    .order("sort_order", { ascending: true });

  if (questionsError || !questions?.length) {
    return actionError("Не удалось загрузить вопросы.");
  }

  const questionIds = questions.map((row) => row.id);
  const { data: options, error: optionsError } = await supabase
    .from("poll_options")
    .select("id, question_id, label, is_correct")
    .in("question_id", questionIds);

  if (optionsError) {
    return actionError("Не удалось загрузить варианты.");
  }

  const optionsByQuestion = new Map<string, NonNullable<typeof options>>();
  for (const option of options ?? []) {
    const list = optionsByQuestion.get(option.question_id) ?? [];
    list.push(option);
    optionsByQuestion.set(option.question_id, list);
  }

  const answerMap = new Map(answers.map((answer) => [answer.questionId, answer]));
  let scoreCorrect = 0;
  let scoreTotal = 0;
  const results: PollQuestionResult[] = [];

  for (const question of questions) {
    const answer = answerMap.get(question.id);
    const questionOptions = optionsByQuestion.get(question.id) ?? [];
    const isTextOnly = question.allows_text || questionOptions.length === 0;

    if (isTextOnly) {
      const textAnswer = answer?.textAnswer?.trim();
      if (!textAnswer) {
        return actionError("Ответьте на все вопросы.");
      }

      const { error } = await supabase.from("poll_answers").upsert(
        {
          poll_id: pollId,
          question_id: question.id,
          respondent_id: user.id,
          option_id: null,
          text_answer: textAnswer,
        },
        { onConflict: "poll_id,question_id,respondent_id" },
      );

      if (error) {
        return actionError("Не удалось сохранить ответы.");
      }

      results.push({
        questionId: question.id,
        prompt: question.prompt,
        isCorrect: null,
        chosenOptionId: null,
        chosenOptionLabel: null,
        chosenTextAnswer: textAnswer,
        correctOptionLabels: [],
      });
      continue;
    }

    if (!answer?.optionId) {
      return actionError("Ответьте на все вопросы.");
    }

    const chosenOption = questionOptions.find((option) => option.id === answer.optionId);
    if (!chosenOption) {
      return actionError("Выберите вариант из списка.");
    }

    const correctLabels = questionOptions.filter((option) => option.is_correct).map((option) => option.label);
    const isCorrect = chosenOption.is_correct;
    scoreTotal += 1;
    if (isCorrect) {
      scoreCorrect += 1;
    }

    const { error } = await supabase.from("poll_answers").upsert(
      {
        poll_id: pollId,
        question_id: question.id,
        respondent_id: user.id,
        option_id: answer.optionId,
        text_answer: null,
      },
      { onConflict: "poll_id,question_id,respondent_id" },
    );

    if (error) {
      return actionError("Не удалось сохранить ответы.");
    }

    results.push({
      questionId: question.id,
      prompt: question.prompt,
      isCorrect,
      chosenOptionId: chosenOption.id,
      chosenOptionLabel: chosenOption.label,
      chosenTextAnswer: null,
      correctOptionLabels: correctLabels,
    });
  }

  const { error: updateError } = await supabase
    .from("partner_polls")
    .update({
      status: "completed",
      completed_at: new Date().toISOString(),
      score_correct: scoreTotal > 0 ? scoreCorrect : null,
      score_total: scoreTotal > 0 ? scoreTotal : null,
    })
    .eq("id", pollId)
    .eq("couple_id", context.coupleId);

  if (updateError) {
    return actionError("Не удалось завершить опрос.");
  }

  revalidatePath("/memories/polls");
  revalidatePath("/memories");
  return {
    ok: true as const,
    scoreCorrect,
    scoreTotal,
    results,
  };
}
