"use client";

import { Check, ListChecks, Plus, Trash2, X } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { useLanguage } from "@/components/providers/language-provider";
import { EmptyState } from "@/components/ui/empty-state";
import { TabGrid } from "@/components/ui/tab-grid";
import { ModalSheet } from "@/components/ui/modal-sheet";
import type { HubPoll } from "@/components/features/hub/types";
import {
  createPartnerPoll,
  submitPollAnswers,
  type PollQuestionInput,
  type PollQuestionResult,
} from "@/lib/polls/actions";
import { formatDateLocalized } from "@/lib/dates";

type PollsPanelProps = {
  polls: HubPoll[];
  userId: string;
  partnerId: string;
  partnerName: string;
};

type PollsTab = "pending" | "completed";

type DraftOption = {
  label: string;
  isCorrect: boolean;
};

type DraftQuestion = {
  prompt: string;
  allowsText: boolean;
  options: DraftOption[];
};

type AnswerDraft = Record<string, { optionId?: string; textAnswer?: string }>;

type SubmitResult = {
  pollTitle: string;
  scoreCorrect: number;
  scoreTotal: number;
  results: PollQuestionResult[];
};

function emptyQuestion(): DraftQuestion {
  return {
    prompt: "",
    allowsText: false,
    options: [
      { label: "", isCorrect: false },
      { label: "", isCorrect: false },
    ],
  };
}

function PollResultsBody({
  scoreCorrect,
  scoreTotal,
  results,
  onClose,
}: Omit<SubmitResult, "pollTitle"> & { onClose: () => void }) {
  const { t } = useLanguage();

  return (
    <div className="grid gap-4">
      {scoreTotal > 0 ? (
        <p className="rounded-2xl bg-[var(--accent-soft)] px-4 py-3 text-center text-sm font-semibold text-[var(--accent)]">
          {t("hubPollsScore", { correct: scoreCorrect, total: scoreTotal })}
        </p>
      ) : null}

      {results.map((result) => (
        <div className="rounded-2xl surface-input p-4" key={result.questionId}>
          <div className="flex items-start justify-between gap-2">
            <p className="font-semibold">{result.prompt}</p>
            {result.isCorrect === true ? (
              <span className="shrink-0 rounded-full bg-emerald-500/15 px-2 py-0.5 text-xs font-semibold text-emerald-400">
                {t("hubPollsCorrect")}
              </span>
            ) : null}
            {result.isCorrect === false ? (
              <span className="shrink-0 rounded-full bg-rose-500/15 px-2 py-0.5 text-xs font-semibold text-rose-400">
                {t("hubPollsIncorrect")}
              </span>
            ) : null}
          </div>

          {result.chosenTextAnswer ? (
            <p className="mt-3 text-sm">
              <span className="text-[var(--muted)]">{t("hubPollsYourChoice")}: </span>
              {result.chosenTextAnswer}
            </p>
          ) : null}

          {result.chosenOptionLabel ? (
            <p className="mt-3 text-sm">
              <span className="text-[var(--muted)]">{t("hubPollsYourChoice")}: </span>
              {result.chosenOptionLabel}
            </p>
          ) : null}

          {result.correctOptionLabels.length ? (
            <p className="mt-2 text-sm">
              <span className="text-[var(--muted)]">{t("hubPollsCorrectAnswer")}: </span>
              {result.correctOptionLabels.join(", ")}
            </p>
          ) : null}
        </div>
      ))}

      <button
        className="rounded-2xl bg-[var(--accent)] py-3 font-semibold text-white"
        onClick={onClose}
        type="button"
      >
        {t("commonClose")}
      </button>
    </div>
  );
}

export function PollsPanel({ polls, userId, partnerId, partnerName }: PollsPanelProps) {
  const [tab, setTab] = useState<PollsTab>("pending");
  const [showCreate, setShowCreate] = useState(false);
  const [title, setTitle] = useState("");
  const [questions, setQuestions] = useState<DraftQuestion[]>([emptyQuestion()]);
  const [answerPollId, setAnswerPollId] = useState<string | null>(null);
  const [detailPollId, setDetailPollId] = useState<string | null>(null);
  const [submitResult, setSubmitResult] = useState<SubmitResult | null>(null);
  const [answerDrafts, setAnswerDrafts] = useState<AnswerDraft>({});
  const [error, setError] = useState("");
  const [isPending, startTransition] = useTransition();
  const router = useRouter();
  const { locale, t } = useLanguage();

  const pendingForMe = polls.filter((poll) => poll.target_user_id === userId && poll.status === "pending");
  const completed = polls.filter((poll) => poll.status === "completed");
  const answerPoll = pendingForMe.find((poll) => poll.id === answerPollId) ?? null;
  const detailPoll = completed.find((poll) => poll.id === detailPollId) ?? null;

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

  function updateOption(questionIndex: number, optionIndex: number, patch: Partial<DraftOption>) {
    setQuestions((current) =>
      current.map((question, qIndex) => {
        if (qIndex !== questionIndex) {
          return question;
        }
        const options = question.options.map((option, oIndex) =>
          oIndex === optionIndex ? { ...option, ...patch } : option,
        );
        return { ...question, options };
      }),
    );
  }

  function addOption(questionIndex: number) {
    setQuestions((current) =>
      current.map((question, qIndex) =>
        qIndex === questionIndex
          ? { ...question, options: [...question.options, { label: "", isCorrect: false }] }
          : question,
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
        options: question.allowsText
          ? []
          : question.options
              .filter((option) => option.label.trim())
              .map((option) => ({
                label: option.label.trim(),
                isCorrect: option.isCorrect,
              })),
      }));

    if (!payload.length) {
      setError(t("hubPollsErrorNoQuestions"));
      return;
    }

    for (const question of payload) {
      if (!question.allowsText && question.options.length >= 2 && !question.options.some((option) => option.isCorrect)) {
        setError(t("hubPollsErrorNoCorrect"));
        return;
      }
    }

    startTransition(async () => {
      const result = await createPartnerPoll(partnerId, title, payload);
      if (!result.ok) {
        setError(result.error ?? t("hubPollsErrorCreate"));
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
        setError(result.error ?? t("hubPollsErrorSubmit"));
        return;
      }
      setAnswerPollId(null);
      setAnswerDrafts({});
      setSubmitResult({
        pollTitle: answerPoll.title,
        scoreCorrect: result.scoreCorrect,
        scoreTotal: result.scoreTotal,
        results: result.results,
      });
      setTab("completed");
      router.refresh();
    });
  }

  return (
    <>
      <TabGrid
        onChange={setTab}
        tabs={[
          { id: "pending", label: t("hubPollsTabPending") },
          { id: "completed", label: t("hubPollsTabCompleted") },
        ]}
        value={tab}
      />

      {tab === "pending" ? (
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
                      {t("hubPollsFrom", {
                        name: poll.creator_name,
                        date: formatDateLocalized(locale, poll.created_at.slice(0, 10)),
                      })}
                    </p>
                    <p className="mt-1 text-xs text-[var(--muted)]">
                      {poll.questions.length === 1
                        ? t("hubPollsQuestionOne")
                        : t("hubPollsQuestionCount", { count: poll.questions.length })}
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
                      {t("hubPollsAnswer")}
                    </button>
                  </div>
                </div>
              </article>
            ))
          ) : (
            <EmptyState
              description={t("hubPollsEmptyDesc", { name: partnerName })}
              title={t("hubPollsEmpty")}
            />
          )}
        </section>
      ) : (
        <section className="grid gap-2">
          {completed.length ? (
            completed.map((poll) => (
              <button
                className="flex w-full items-center gap-3 rounded-2xl surface-panel px-4 py-3 text-left active:scale-[0.99]"
                key={poll.id}
                onClick={() => setDetailPollId(poll.id)}
                type="button"
              >
                <span className="h-8 w-1 shrink-0 rounded-full bg-[var(--accent)]" />
                <span className="min-w-0 flex-1">
                  <span className="block truncate font-semibold">{poll.title}</span>
                  <span className="mt-0.5 block text-xs text-[var(--muted)]">
                    {poll.respondent_name
                      ? t("hubPollsRespondedBy", { name: poll.respondent_name })
                      : poll.creator_name}
                    {poll.score_total != null && poll.score_correct != null
                      ? ` · ${t("hubPollsScoreShort", { correct: poll.score_correct, total: poll.score_total })}`
                      : ""}
                  </span>
                </span>
                {poll.completed_at ? (
                  <time className="shrink-0 text-xs text-[var(--muted)]">
                    {formatDateLocalized(locale, poll.completed_at.slice(0, 10))}
                  </time>
                ) : null}
              </button>
            ))
          ) : (
            <EmptyState
              description={t("hubPollsCompletedEmptyDesc")}
              title={t("hubPollsCompletedEmpty")}
            />
          )}
        </section>
      )}

      <button
        aria-label={t("hubPollsCreate")}
        className="fixed bottom-[calc(max(0.75rem,env(safe-area-inset-bottom))+5.25rem)] right-5 z-30 grid size-14 place-items-center rounded-full bg-[var(--accent)] text-white shadow-lg active:scale-95"
        onClick={() => setShowCreate(true)}
        type="button"
      >
        <Plus aria-hidden className="size-7" strokeWidth={2.2} />
      </button>

      {showCreate ? (
        <ModalSheet as="form" className="max-h-[90vh]" onClose={resetCreate} onSubmit={submitCreate} open>
            <div className="mb-4 flex items-center justify-between">
              <p className="text-lg font-bold">{t("hubPollsFor", { name: partnerName })}</p>
              <button
                aria-label={t("commonClose")}
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
                placeholder={t("hubPollsTitlePlaceholder")}
                required
                value={title}
              />

              {questions.map((question, questionIndex) => (
                <div className="rounded-2xl surface-input p-4" key={questionIndex}>
                  <div className="mb-2 flex items-center justify-between gap-2">
                    <p className="text-sm font-semibold">
                      {t("hubPollsQuestionN", { n: questionIndex + 1 })}
                    </p>
                    {questions.length > 1 ? (
                      <button
                        aria-label={t("hubPollsDeleteQuestion")}
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
                    placeholder={t("hubPollsQuestionPlaceholder")}
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
                    {t("hubPollsTextOnly")}
                  </label>

                  {!question.allowsText ? (
                    <div className="mt-3 grid gap-2">
                      {question.options.map((option, optionIndex) => (
                        <div className="flex items-center gap-2" key={optionIndex}>
                          <input
                            className="min-w-0 flex-1 rounded-xl bg-[var(--surface)] px-3 py-2.5 text-sm"
                            onChange={(event) =>
                              updateOption(questionIndex, optionIndex, { label: event.target.value })
                            }
                            placeholder={t("hubPollsOptionN", { n: optionIndex + 1 })}
                            value={option.label}
                          />
                          <button
                            aria-label={t("hubPollsMarkCorrect")}
                            aria-pressed={option.isCorrect}
                            className={`grid size-11 shrink-0 place-items-center rounded-xl ${
                              option.isCorrect
                                ? "bg-emerald-500/20 text-emerald-400"
                                : "surface-input text-[var(--muted)]"
                            }`}
                            onClick={() =>
                              updateOption(questionIndex, optionIndex, { isCorrect: !option.isCorrect })
                            }
                            title={t("hubPollsMarkCorrect")}
                            type="button"
                          >
                            <Check aria-hidden className="size-5" />
                          </button>
                        </div>
                      ))}
                      <button
                        className="rounded-xl px-2 py-2 text-left text-xs font-semibold text-[var(--accent)]"
                        onClick={() => addOption(questionIndex)}
                        type="button"
                      >
                        {t("hubPollsAddOption")}
                      </button>
                      <p className="text-xs text-[var(--muted)]">{t("hubPollsMarkCorrectHint")}</p>
                    </div>
                  ) : null}
                </div>
              ))}

              <button
                className="rounded-2xl surface-input py-2.5 text-sm font-semibold"
                onClick={() => setQuestions((current) => [...current, emptyQuestion()])}
                type="button"
              >
                {t("hubPollsAddQuestion")}
              </button>

              {error ? <p className="alert-error rounded-xl px-3 py-2 text-sm">{error}</p> : null}

              <button
                className="rounded-2xl bg-[var(--accent)] py-3 font-semibold text-white disabled:opacity-60"
                disabled={!title.trim() || isPending}
                type="submit"
              >
                {isPending ? t("hubPollsSubmitting") : t("hubPollsCreatePoll")}
              </button>
            </div>
        </ModalSheet>
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
                aria-label={t("commonClose")}
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
                        placeholder={t("hubPollsYourAnswer")}
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
                {isPending ? t("hubPollsSubmitting") : t("hubPollsSubmitAnswers")}
              </button>
            </div>
          </form>
        </div>
      ) : null}

      {submitResult ? (
        <div className="fixed inset-0 z-50 flex items-end bg-black/40 p-4 pb-[calc(max(0.75rem,env(safe-area-inset-bottom))+5rem)]">
          <div className="max-h-[90vh] w-full overflow-y-auto rounded-3xl surface-panel p-5 shadow-xl">
            <div className="mb-4 flex items-center justify-between gap-3">
              <p className="text-lg font-bold">{t("hubPollsResultsTitle")}</p>
              <button
                aria-label={t("commonClose")}
                className="grid size-9 shrink-0 place-items-center rounded-full surface-input"
                onClick={() => setSubmitResult(null)}
                type="button"
              >
                <X aria-hidden className="size-5" />
              </button>
            </div>
            <p className="mb-4 text-sm font-semibold">{submitResult.pollTitle}</p>
            <PollResultsBody {...submitResult} onClose={() => setSubmitResult(null)} />
          </div>
        </div>
      ) : null}

      {detailPoll ? (
        <div className="fixed inset-0 z-50 flex items-end bg-black/40 p-4 pb-[calc(max(0.75rem,env(safe-area-inset-bottom))+5rem)]">
          <div className="max-h-[90vh] w-full overflow-y-auto rounded-3xl surface-panel p-5 shadow-xl">
            <div className="mb-4 flex items-center justify-between gap-3">
              <p className="text-lg font-bold">{detailPoll.title}</p>
              <button
                aria-label={t("commonClose")}
                className="grid size-9 shrink-0 place-items-center rounded-full surface-input"
                onClick={() => setDetailPollId(null)}
                type="button"
              >
                <X aria-hidden className="size-5" />
              </button>
            </div>

            <p className="mb-4 text-sm text-[var(--muted)]">
              {t("hubPollsFrom", {
                name: detailPoll.creator_name,
                date: formatDateLocalized(locale, detailPoll.created_at.slice(0, 10)),
              })}
              {detailPoll.respondent_name
                ? ` · ${t("hubPollsRespondedBy", { name: detailPoll.respondent_name })}`
                : ""}
            </p>

            {detailPoll.score_total != null && detailPoll.score_correct != null ? (
              <p className="mb-4 rounded-2xl bg-[var(--accent-soft)] px-4 py-3 text-center text-sm font-semibold text-[var(--accent)]">
                {t("hubPollsScore", {
                  correct: detailPoll.score_correct,
                  total: detailPoll.score_total,
                })}
              </p>
            ) : null}

            <div className="grid gap-4">
              {detailPoll.questions.map((question) => {
                const chosenLabel =
                  question.chosen_text_answer ??
                  question.options.find((option) => option.id === question.chosen_option_id)?.label ??
                  null;
                const correctLabels = question.options
                  .filter((option) => option.is_correct)
                  .map((option) => option.label);

                return (
                  <div className="rounded-2xl surface-input p-4" key={question.id}>
                    <div className="flex items-start justify-between gap-2">
                      <p className="font-semibold">{question.prompt}</p>
                      {question.is_correct === true ? (
                        <span className="shrink-0 rounded-full bg-emerald-500/15 px-2 py-0.5 text-xs font-semibold text-emerald-400">
                          {t("hubPollsCorrect")}
                        </span>
                      ) : null}
                      {question.is_correct === false ? (
                        <span className="shrink-0 rounded-full bg-rose-500/15 px-2 py-0.5 text-xs font-semibold text-rose-400">
                          {t("hubPollsIncorrect")}
                        </span>
                      ) : null}
                    </div>

                    {chosenLabel ? (
                      <p className="mt-3 text-sm">
                        <span className="text-[var(--muted)]">{t("hubPollsYourChoice")}: </span>
                        {chosenLabel}
                      </p>
                    ) : null}

                    {correctLabels.length ? (
                      <p className="mt-2 text-sm">
                        <span className="text-[var(--muted)]">{t("hubPollsCorrectAnswer")}: </span>
                        {correctLabels.join(", ")}
                      </p>
                    ) : null}

                    {question.allows_text && question.chosen_text_answer ? (
                      <p className="mt-2 text-xs text-[var(--muted)]">{t("hubPollsTextAnswer")}</p>
                    ) : null}
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
}
