import { redirect } from "next/navigation";
import { PlansPanel } from "@/components/features/plans/plans-panel";
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
    .select("id, title, details, status, due_at, remind_enabled, completed_at")
    .eq("couple_id", context.coupleId)
    .order("created_at", { ascending: false });

  const activePlans = plans?.filter((plan) => plan.status === "active") ?? [];
  const completedPlans = plans?.filter((plan) => plan.status === "completed") ?? [];

  return (
    <main className="mx-auto min-h-screen max-w-md px-5 pb-32 pt-8">
      <PlansPanel activePlans={activePlans} completedPlans={completedPlans} />
    </main>
  );
}
