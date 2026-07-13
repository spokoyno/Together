import { redirect } from "next/navigation";
import { MoodPageContent } from "@/components/features/mood/mood-page-content";
import { requireUser } from "@/lib/auth/session";
import { getCoupleContextForUser } from "@/lib/couple/context.server";

export default async function MoodPage() {
  const { supabase, user } = await requireUser();
  const context = await getCoupleContextForUser(user.id);

  if (!context?.isComplete) {
    redirect("/dashboard");
  }

  const [{ data: myMoods }, { data: partnerMoods }] = await Promise.all([
    supabase
      .from("moods")
      .select("level, energy, note, created_at")
      .eq("couple_id", context.coupleId)
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })
      .limit(10),
    context.partner
      ? supabase
          .from("moods")
          .select("level, energy, note, created_at")
          .eq("couple_id", context.coupleId)
          .eq("user_id", context.partner.id)
          .order("created_at", { ascending: false })
          .limit(5)
      : Promise.resolve({ data: [] }),
  ]);

  return (
    <main className="mx-auto min-h-screen max-w-md px-5 pb-28 pt-8">
      <MoodPageContent
        myMoods={myMoods ?? []}
        partnerMoods={partnerMoods ?? []}
        partnerName={context.partner?.display_name ?? null}
      />
    </main>
  );
}
