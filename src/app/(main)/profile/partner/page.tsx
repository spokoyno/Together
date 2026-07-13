import { redirect } from "next/navigation";
import { PartnerProfileScreen } from "@/components/features/profile/partner-profile-screen";
import { requireUser } from "@/lib/auth/session";
import { getCoupleContextForUser } from "@/lib/couple/context.server";
import { daysBetween } from "@/lib/dates";
import { signMediaPaths } from "@/lib/media/actions";
import { loadPartnerFacts } from "@/lib/hub/load-data.server";
import type { ProfileGender } from "@/types/domain";

export default async function PartnerProfilePage() {
  const { supabase, user } = await requireUser();
  const context = await getCoupleContextForUser(user.id);

  if (!context?.isComplete || !context.partner) {
    redirect("/profile");
  }

  const hubCtx = {
    supabase,
    userId: user.id,
    coupleId: context.coupleId,
    partnerId: context.partner.id,
    partnerName: context.partner.display_name,
  };

  const [nicknames, myProfile, partnerProfile, facts] = await Promise.all([
    supabase
      .from("partner_nicknames")
      .select("id, nickname, created_at")
      .eq("couple_id", context.coupleId)
      .eq("target_user_id", context.partner.id)
      .order("created_at", { ascending: false }),
    supabase
      .from("profiles")
      .select("notifications_enabled, partner_nickname")
      .eq("id", user.id)
      .single(),
    supabase
      .from("profiles")
      .select("avatar_path, gender")
      .eq("id", context.partner.id)
      .single(),
    loadPartnerFacts(hubCtx, context.partner.id),
  ]);

  const signed = await signMediaPaths(
    supabase,
    partnerProfile.data?.avatar_path ? [partnerProfile.data.avatar_path] : [],
  );
  const partnerAvatarUrl = partnerProfile.data?.avatar_path
    ? signed[partnerProfile.data.avatar_path] ?? null
    : null;

  const daysTogether =
    context.relationshipStartedOn ? daysBetween(context.relationshipStartedOn) : null;

  return (
    <PartnerProfileScreen
      activeNickname={myProfile.data?.partner_nickname ?? null}
      daysTogether={daysTogether}
      facts={facts}
      nicknames={nicknames.data ?? []}
      notificationsEnabled={myProfile.data?.notifications_enabled ?? true}
      partnerAvatarUrl={partnerAvatarUrl}
      partnerGender={(partnerProfile.data?.gender as ProfileGender | null) ?? null}
      partnerId={context.partner.id}
      partnerName={context.partner.display_name}
      relationshipStartedOn={context.relationshipStartedOn}
    />
  );
}
