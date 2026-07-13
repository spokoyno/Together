import { redirect } from "next/navigation";
import { PartnerProfileScreen } from "@/components/features/profile/partner-profile-screen";
import { requireUser } from "@/lib/auth/session";
import { getCoupleContextForUser } from "@/lib/couple/context.server";
import { daysBetween } from "@/lib/dates";

export default async function PartnerProfilePage() {
  const { supabase, user } = await requireUser();
  const context = await getCoupleContextForUser(user.id);

  if (!context?.isComplete || !context.partner) {
    redirect("/profile");
  }

  const [stats, nicknames, profile] = await Promise.all([
    Promise.all([
      supabase
        .from("moods")
        .select("id", { count: "exact", head: true })
        .eq("couple_id", context.coupleId),
      supabase
        .from("plans")
        .select("id", { count: "exact", head: true })
        .eq("couple_id", context.coupleId),
      supabase
        .from("memories")
        .select("id", { count: "exact", head: true })
        .eq("couple_id", context.coupleId),
      supabase
        .from("answers")
        .select("id", { count: "exact", head: true })
        .eq("user_id", user.id),
    ]),
    supabase
      .from("partner_nicknames")
      .select("id, nickname, created_at")
      .eq("couple_id", context.coupleId)
      .eq("target_user_id", context.partner.id)
      .order("created_at", { ascending: false }),
    supabase
      .from("profiles")
      .select("notifications_enabled")
      .eq("id", user.id)
      .single(),
  ]);

  const daysTogether =
    context.relationshipStartedOn ? daysBetween(context.relationshipStartedOn) : null;

  return (
    <PartnerProfileScreen
      daysTogether={daysTogether}
      nicknames={nicknames.data ?? []}
      notificationsEnabled={profile.data?.notifications_enabled ?? true}
      partnerId={context.partner.id}
      partnerName={context.partner.display_name}
      relationshipStartedOn={context.relationshipStartedOn}
      stats={{
        moods: stats[0].count ?? 0,
        plans: stats[1].count ?? 0,
        memories: stats[2].count ?? 0,
        answers: stats[3].count ?? 0,
      }}
    />
  );
}
