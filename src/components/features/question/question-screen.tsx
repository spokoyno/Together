"use client";

import Link from "next/link";
import { useLanguage } from "@/components/providers/language-provider";
import { saveAnswer } from "@/lib/question/actions";

type QuestionScreenProps = {
  dailyQuestionId: string;
  prompt: string;
  myAnswer: string | null;
  partnerAnswer: string | null;
  partnerName: string;
};

export function QuestionScreen({
  dailyQuestionId,
  prompt,
  myAnswer,
  partnerAnswer,
  partnerName,
}: QuestionScreenProps) {
  const { t } = useLanguage();
  const bothAnswered = Boolean(myAnswer && partnerAnswer);

  if (!prompt) {
    return (
      <>
        <h1 className="text-3xl font-semibold">{t("questionTitle")}</h1>
        <p className="mt-4 text-[var(--muted)]">{t("questionNotLoaded")}</p>
      </>
    );
  }

  return (
    <>
      <Link className="text-sm text-[var(--accent)]" href="/dashboard">
        ← {t("backHome")}
      </Link>
      <p className="mt-5 text-sm font-medium text-[var(--accent)]">{t("questionTitle")}</p>
      <h1 className="mt-2 text-3xl font-semibold">{prompt}</h1>

      {!myAnswer ? (
        <form action={saveAnswer} className="mt-8 grid gap-3">
          <input name="dailyQuestionId" type="hidden" value={dailyQuestionId} />
          <textarea
            className="rounded-2xl surface-input px-4 py-3"
            name="answer"
            placeholder={t("questionYourAnswer")}
            required
            rows={5}
          />
          <button
            className="rounded-2xl bg-[var(--accent)] px-4 py-3 font-semibold text-white"
            type="submit"
          >
            {t("questionSubmit")}
          </button>
        </form>
      ) : (
        <section className="mt-8 rounded-[1.75rem] surface-panel p-5">
          <p className="text-sm text-[var(--muted)]">{t("questionYourAnswer")}</p>
          <p className="mt-2 leading-7">{myAnswer}</p>
        </section>
      )}

      {myAnswer && !partnerAnswer ? (
        <p className="mt-6 rounded-2xl surface-input px-4 py-3 text-sm text-[var(--muted)]">
          {t("questionPartnerLocked", { partner: partnerName })}
        </p>
      ) : null}

      {bothAnswered && partnerAnswer ? (
        <section className="mt-6 rounded-[1.75rem] surface-panel p-5">
          <p className="text-sm text-[var(--muted)]">{partnerName}</p>
          <p className="mt-2 leading-7">{partnerAnswer}</p>
        </section>
      ) : null}
    </>
  );
}
