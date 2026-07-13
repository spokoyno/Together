import { CalendarPlansPanel } from "@/components/features/plans/calendar-plans-panel";
import { redirect } from "next/navigation";
import { requireUser } from "@/lib/auth/session";
import { getCoupleContextForUser } from "@/lib/couple/context.server";
import { buildCoupleHolidays } from "@/lib/plans/holidays";

export default async function PlansPage() {
  const { supabase, user } = await requireUser();
  const context = await getCoupleContextForUser(user.id);

  if (!context?.isComplete || !context.partner) {
    redirect("/dashboard");
  }

  const me = context.members.find((member) => member.id === user.id);
  const partner = context.partner;

  const { data: profiles } = await supabase
    .from("profiles")
    .select("id, birthday")
    .in("id", [user.id, partner.id]);

  const myBirthday = profiles?.find((row) => row.id === user.id)?.birthday ?? null;
  const partnerBirthday = profiles?.find((row) => row.id === partner.id)?.birthday ?? null;
  const year = new Date().getFullYear();

  const holidays = buildCoupleHolidays({
    year,
    myBirthday,
    partnerBirthday,
    myName: me?.display_name ?? "",
    partnerName: partner.display_name,
  });

  const { data: plans } = await supabase
    .from("plans")
    .select(
      "id, title, details, status, due_at, remind_enabled, is_surprise, created_by, completed_at",
    )
    .eq("couple_id", context.coupleId)
    .order("due_at", { ascending: true, nullsFirst: false });

  return (
    <main className="mx-auto min-h-screen max-w-md px-5 pb-32 pt-8">
      <CalendarPlansPanel holidays={holidays} plans={plans ?? []} userId={user.id} />
    </main>
  );
}
