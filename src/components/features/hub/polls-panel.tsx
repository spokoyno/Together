"use client";

import { ListChecks, Plus, Trash2, X } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { EmptyState } from "@/components/ui/empty-state";
import type { HubPoll } from "@/components/features/hub/types";
import { createPartnerPoll, submitPollAnswers, type PollQuestionInput } from "@/lib/polls/actions";
import { formatDateRu } from "@/lib/dates";

type PollsPanelProps = {
  polls: HubPoll[];
  userId: string;
  partnerId: string;
  partnerName: string;
};

type DraftQuestion = {
  prompt: string;
  allowsText: boolean;
  options: string[];
};

type AnswerDraft = Record<string, { optionId?: string; textAnswer?: string }>;

function emptyQuestion(): DraftQuestion {
  return { prompt: "", allowsText: false, options: ["", ""] };
}

export function PollsPanel({ polls, userId, partnerId, partnerName }: PollsPanelProps) {
  const [showCreate, setShowCreate] = useState(false);
  const [title, setTitle] = useState("");
  const [questions, setQuestions] = useState<DraftQuestion[]>([emptyQuestion()]);
  const [answerPollId, setAnswerPollId] = useState<string | null>(null);
  const [answerDrafts, setAnswerDrafts] = useState<AnswerDraft>({});
  const [error, setError] = useState("");
  const [isPending, startTransition] = useTransition();
  const router = useRouter();

  const pendingForMe = polls.filter((poll) => poll.target_user_id === userId && poll.status === "pending");
  const answerPoll = pendingForMe.find((poll) => poll.id === answerPollId) ?? null;

  function resetCreate() {
    setShowCreate(false);
    setTitle("");
    setQuestions([emptyQuestion()]);
    setError("");
  }

  function updateQuestion(index: number, patch: Partial<DraftQuestion>) {
    setQuestions((current) =>
      current.map((question, questionIndex) =>
        questionIndex === index ? { ...question, ...patch } : question,
      ),
    );
  }

  function updateOption(questionIndex: number, optionIndex: number, value: string) {
    setQuestions((current) =>
      current.map((question, qIndex) => {
        if (qIndex !== questionIndex) {
          return question;
        }
        const options = [...question.options];
        options[optionIndex] = value;
        return { ...question, options };
      }),
    );
  }

  function addOption(questionIndex: number) {
    setQuestions((current) =>
      current.map((question, qIndex) =>
        qIndex === questionIndex ? { ...question, options: [...question.options, ""] } : question,
      ),
    );
  }

  function removeQuestion(index: number) {
    setQuestions((current) => (current.length > 1 ? current.filter((_, qIndex) => qIndex !== index) : current));
  }

  function submitCreate(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");

    const payload: PollQuestionInput[] = questions
      .filter((question) => question.prompt.trim())
      .map((question) => ({
        prompt: question.prompt.trim(),
        allowsText: question.allowsText,
        options: question.allowsText ? [] : question.options.map((option) => option.trim()).filter(Boolean),
      }));

    if (!payload.length) {
      setError("Добавьте хотя бы один вопрос.");
      return;
    }

    startTransition(async () => {
      const result = await createPartnerPoll(partnerId, title, payload);
      if (!result.ok) {
        setError(result.error ?? "Не удалось создать опрос.");
        return;
      }
      resetCreate();
      router.refresh();
    });
  }

  function setAnswer(questionId: string, patch: { optionId?: string; textAnswer?: string }) {
    setAnswerDrafts((current) => ({
      ...current,
      [questionId]: { ...current[questionId], ...patch },
    }));
  }

  function submitAnswers(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!answerPoll) {
      return;
    }

    setError("");
    const answers = answerPoll.questions.map((question) => {
      const draft = answerDrafts[question.id];
      const isTextOnly = question.allows_text || question.options.length === 0;
      return {
        questionId: question.id,
        optionId: isTextOnly ? undefined : draft?.optionId,
        textAnswer: isTextOnly ? draft?.textAnswer : undefined,
      };
    });

    startTransition(async () => {
      const result = await submitPollAnswers(answerPoll.id, answers);
      if (!result.ok) {
        setError(result.error ?? "Не удалось отправить ответы.");
        return;
      }
      setAnswerPollId(null);
      setAnswerDrafts({});
      router.refresh();
    });
  }

  return (
    <>
      <section className="grid gap-3">
        {pendingForMe.length ? (
          pendingForMe.map((poll) => (
            <article className="rounded-3xl surface-panel p-4" key={poll.id}>
              <div className="flex items-start gap-3">
                <div className="grid size-12 shrink-0 place-items-center rounded-2xl bg-[var(--accent-soft)] text-[var(--accent)]">
                  <ListChecks aria-hidden className="size-6" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="font-bold">{poll.title}</p>
                  <p className="mt-1 text-sm text-[var(--muted)]">
                    От {poll.creator_name} · {formatDateRu(poll.created_at)}
                  </p>
                  <p className="mt-1 text-xs text-[var(--muted)]">
                    {poll.questions.length} {poll.questions.length === 1 ? "вопрос" : "вопроса"}
                  </p>
                  <button
                    className="mt-3 rounded-xl bg-[var(--accent)] px-3 py-2.5 text-xs font-semibold text-white"
                    onClick={() => {
                      setAnswerPollId(poll.id);
                      setAnswerDrafts({});
                      setError("");
                    }}
                    type="button"
                  >
                    Ответить
                  </button>
                </div>
              </div>
            </article>
          ))
        ) : (
          <EmptyState
            description={`Создайте опрос для ${partnerName} или дождитесь нового.`}
            title="Нет опросов для ответа"
          />
        )}
      </section>

      <button
        aria-label="Создать опрос"
        className="fixed bottom-[calc(max(0.75rem,env(safe-area-inset-bottom))+5.25rem)] right-5 z-30 grid size-14 place-items-center rounded-full bg-[var(--accent)] text-white shadow-lg active:scale-95"
        onClick={() => setShowCreate(true)}
        type="button"
      >
        <Plus aria-hidden className="size-7" strokeWidth={2.2} />
      </button>

      {showCreate ? (
        <div className="fixed inset-0 z-50 flex items-end bg-black/40 p-4 pb-[calc(max(0.75rem,env(safe-area-inset-bottom))+5rem)]">
          <form
            className="max-h-[90vh] w-full overflow-y-auto rounded-3xl surface-panel p-5 shadow-xl"
            onSubmit={submitCreate}
          >
            <div className="mb-4 flex items-center justify-between">
              <p className="text-lg font-bold">Опрос для {partnerName}</p>
              <button
                aria-label="Закрыть"
                className="grid size-9 place-items-center rounded-full surface-input"
                onClick={resetCreate}
                type="button"
              >
                <X aria-hidden className="size-5" />
              </button>
            </div>

            <div className="grid gap-4">
              <input
                className="rounded-2xl surface-input px-4 py-3"
                onChange={(event) => setTitle(event.target.value)}
                placeholder="Название опроса"
                required
                value={title}
              />

              {questions.map((question, questionIndex) => (
                <div className="rounded-2xl surface-input p-4" key={questionIndex}>
                  <div className="mb-2 flex items-center justify-between gap-2">
                    <p className="text-sm font-semibold">Вопрос {questionIndex + 1}</p>
                    {questions.length > 1 ? (
                      <button
                        aria-label="Удалить вопрос"
                        className="grid size-8 place-items-center rounded-full text-[var(--muted)]"
                        onClick={() => removeQuestion(questionIndex)}
                        type="button"
                      >
                        <Trash2 aria-hidden className="size-4" />
                      </button>
                    ) : null}
                  </div>

                  <input
                    className="w-full rounded-xl bg-[var(--surface)] px-3 py-2.5 text-sm"
                    onChange={(event) => updateQuestion(questionIndex, { prompt: event.target.value })}
                    placeholder="Текст вопроса"
                    required
                    value={question.prompt}
                  />

                  <label className="mt-3 flex min-h-10 items-center gap-2 text-sm font-medium">
                    <input
                      checked={question.allowsText}
                      className="size-4 accent-[var(--accent)]"
                      onChange={(event) =>
                        updateQuestion(questionIndex, { allowsText: event.target.checked })
                      }
                      type="checkbox"
                    />
                    Только текстовый ответ
                  </label>

                  {!question.allowsText ? (
                    <div className="mt-3 grid gap-2">
                      {question.options.map((option, optionIndex) => (
                        <input
                          className="rounded-xl bg-[var(--surface)] px-3 py-2.5 text-sm"
                          key={optionIndex}
                          onChange={(event) => updateOption(questionIndex, optionIndex, event.target.value)}
                          placeholder={`Вариант ${optionIndex + 1}`}
                          value={option}
                        />
                      ))}
                      <button
                        className="rounded-xl px-2 py-2 text-left text-xs font-semibold text-[var(--accent)]"
                        onClick={() => addOption(questionIndex)}
                        type="button"
                      >
                        + Добавить вариант
                      </button>
                    </div>
                  ) : null}
                </div>
              ))}

              <button
                className="rounded-2xl surface-input py-2.5 text-sm font-semibold"
                onClick={() => setQuestions((current) => [...current, emptyQuestion()])}
                type="button"
              >
                + Добавить вопрос
              </button>

              {error ? <p className="alert-error rounded-xl px-3 py-2 text-sm">{error}</p> : null}

              <button
                className="rounded-2xl bg-[var(--accent)] py-3 font-semibold text-white disabled:opacity-60"
                disabled={!title.trim() || isPending}
                type="submit"
              >
                {isPending ? "Отправляем…" : "Создать опрос"}
              </button>
            </div>
          </form>
        </div>
      ) : null}

      {answerPoll ? (
        <div className="fixed inset-0 z-50 flex items-end bg-black/40 p-4 pb-[calc(max(0.75rem,env(safe-area-inset-bottom))+5rem)]">
          <form
            className="max-h-[90vh] w-full overflow-y-auto rounded-3xl surface-panel p-5 shadow-xl"
            onSubmit={submitAnswers}
          >
            <div className="mb-4 flex items-center justify-between gap-3">
              <p className="text-lg font-bold">{answerPoll.title}</p>
              <button
                aria-label="Закрыть"
                className="grid size-9 shrink-0 place-items-center rounded-full surface-input"
                onClick={() => {
                  setAnswerPollId(null);
                  setAnswerDrafts({});
                  setError("");
                }}
                type="button"
              >
                <X aria-hidden className="size-5" />
              </button>
            </div>

            <div className="grid gap-4">
              {answerPoll.questions.map((question) => {
                const isTextOnly = question.allows_text || question.options.length === 0;
                const draft = answerDrafts[question.id];

                return (
                  <div className="rounded-2xl surface-input p-4" key={question.id}>
                    <p className="font-semibold">{question.prompt}</p>

                    {isTextOnly ? (
                      <textarea
                        className="mt-3 min-h-20 w-full rounded-xl bg-[var(--surface)] px-3 py-2.5 text-sm"
                        onChange={(event) => setAnswer(question.id, { textAnswer: event.target.value })}
                        placeholder="Ваш ответ…"
                        value={draft?.textAnswer ?? ""}
                      />
                    ) : (
                      <div className="mt-3 grid gap-2">
                        {question.options.map((option) => (
                          <label
                            className={`flex min-h-11 cursor-pointer items-center gap-3 rounded-xl px-3 py-2.5 ${
                              draft?.optionId === option.id ? "bg-[var(--accent-soft)]" : "bg-[var(--surface)]"
                            }`}
                            key={option.id}
                          >
                            <input
                              checked={draft?.optionId === option.id}
                              className="size-4 accent-[var(--accent)]"
                              name={`poll-${question.id}`}
                              onChange={() => setAnswer(question.id, { optionId: option.id })}
                              type="radio"
                            />
                            <span className="text-sm font-medium">{option.label}</span>
                          </label>
                        ))}
                      </div>
                    )}
                  </div>
                );
              })}

              {error ? <p className="alert-error rounded-xl px-3 py-2 text-sm">{error}</p> : null}

              <button
                className="rounded-2xl bg-[var(--accent)] py-3 font-semibold text-white disabled:opacity-60"
                disabled={isPending}
                type="submit"
              >
                {isPending ? "Отправляем…" : "Отправить ответы"}
              </button>
            </div>
          </form>
        </div>
      ) : null}
    </>
  );
}
