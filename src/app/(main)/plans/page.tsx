import { CalendarPlansPanel } from "@/components/features/plans/calendar-plans-panel";
import { redirect } from "next/navigation";
import { requireUser } from "@/lib/auth/session";
import { getCoupleContextForUser } from "@/lib/couple/context.server";

export default async function PlansPage() {
  const { supabase, user } = await requireUser();
  const context = await getCoupleContextForUser(user.id);

  if (!context?.isComplete) {
    redirect("/dashboard");
  }

  const { data: plans } = await supabase
    .from("plans")
    .select(
      "id, title, details, status, due_at, remind_enabled, is_surprise, created_by, completed_at",
    )
    .eq("couple_id", context.coupleId)
    .order("due_at", { ascending: true, nullsFirst: false });

  return (
    <main className="mx-auto min-h-screen max-w-md px-5 pb-32 pt-8">
      <CalendarPlansPanel plans={plans ?? []} userId={user.id} />
    </main>
  );
}
