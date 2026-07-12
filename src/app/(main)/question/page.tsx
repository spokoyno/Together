import Link from "next/link";
import { redirect } from "next/navigation";
import { saveAnswer, getOrCreateDailyQuestion } from "@/lib/question/actions";
import { requireUser } from "@/lib/auth/session";
import { getCoupleContext } from "@/lib/couple/context";

export default async function QuestionPage() {
  const { supabase, user } = await requireUser();
  const context = await getCoupleContext(supabase, user.id);

  if (!context?.isComplete) {
    redirect("/dashboard");
  }

  const dailyQuestion = await getOrCreateDailyQuestion(supabase, context.coupleId);

  if (!dailyQuestion) {
    return (
      <main className="mx-auto min-h-screen max-w-md px-5 pb-28 pt-8">
        <h1 className="text-3xl font-bold">Вопрос дня</h1>
        <p className="mt-4 text-[var(--muted)]">Вопросы пока не загружены. Примените seed.sql в Supabase.</p>
      </main>
    );
  }

  const { data: answers } = await supabase
    .from("answers")
    .select("user_id, answer, profiles(display_name)")
    .eq("daily_question_id", dailyQuestion.id);

  const myAnswer = answers?.find((answer) => answer.user_id === user.id);
  const partnerAnswer = context.partner
    ? answers?.find((answer) => answer.user_id === context.partner?.id)
    : null;

  const bothAnswered = Boolean(myAnswer && partnerAnswer);

  return (
    <main className="mx-auto min-h-screen max-w-md px-5 pb-28 pt-8">
      <Link className="text-sm text-[var(--accent)]" href="/dashboard">
        ← На главную
      </Link>
      <p className="mt-5 text-sm font-semibold text-[var(--accent)]">Вопрос дня</p>
      <h1 className="mt-2 text-3xl font-bold">{dailyQuestion.questions?.prompt}</h1>

      {!myAnswer ? (
        <form action={saveAnswer} className="mt-8 grid gap-3">
          <input name="dailyQuestionId" type="hidden" value={dailyQuestion.id} />
          <textarea
            className="rounded-2xl surface-input px-4 py-3"
            name="answer"
            placeholder="Ваш ответ"
            required
            rows={5}
          />
          <button className="rounded-2xl bg-[var(--accent)] px-4 py-3 font-semibold text-white" type="submit">
            Отправить
          </button>
        </form>
      ) : (
        <section className="mt-8 rounded-3xl surface-panel p-5">
          <p className="text-sm text-[var(--muted)]">Ваш ответ</p>
          <p className="mt-2 leading-7">{myAnswer.answer}</p>
        </section>
      )}

      {myAnswer && !partnerAnswer ? (
        <p className="mt-6 rounded-2xl surface-input px-4 py-3 text-sm text-[var(--muted)]">
          Ответ партнёра откроется, когда {context.partner?.display_name} тоже ответит.
        </p>
      ) : null}

      {bothAnswered && partnerAnswer ? (
        <section className="mt-6 rounded-3xl surface-panel p-5">
          <p className="text-sm text-[var(--muted)]">{context.partner?.display_name}</p>
          <p className="mt-2 leading-7">{partnerAnswer.answer}</p>
        </section>
      ) : null}
    </main>
  );
}
