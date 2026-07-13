import { redirect } from "next/navigation";
import { QuestionScreen } from "@/components/features/question/question-screen";
import { requireUser } from "@/lib/auth/session";
import { getCoupleContextForUser } from "@/lib/couple/context.server";
import { getOrCreateDailyQuestion } from "@/lib/question/actions";

export default async function QuestionPage() {
  const { supabase, user } = await requireUser();
  const context = await getCoupleContextForUser(user.id);

  if (!context?.isComplete) {
    redirect("/dashboard");
  }

  const dailyQuestion = await getOrCreateDailyQuestion(supabase, context.coupleId);

  if (!dailyQuestion) {
    return (
      <main className="mx-auto min-h-screen max-w-md px-5 pb-28 pt-8">
        <QuestionScreen
          dailyQuestionId=""
          myAnswer={null}
          partnerAnswer={null}
          partnerName={context.partner?.display_name ?? ""}
          prompt=""
        />
      </main>
    );
  }

  const { data: answers } = await supabase
    .from("answers")
    .select("user_id, answer")
    .eq("daily_question_id", dailyQuestion.id);

  const myAnswer = answers?.find((answer) => answer.user_id === user.id)?.answer ?? null;
  const partnerAnswer = context.partner
    ? (answers?.find((answer) => answer.user_id === context.partner?.id)?.answer ?? null)
    : null;

  return (
    <main className="mx-auto min-h-screen max-w-md px-5 pb-28 pt-8">
      <QuestionScreen
        dailyQuestionId={dailyQuestion.id}
        myAnswer={myAnswer}
        partnerAnswer={partnerAnswer}
        partnerName={context.partner?.display_name ?? ""}
        prompt={dailyQuestion.questions?.prompt ?? ""}
      />
    </main>
  );
}
