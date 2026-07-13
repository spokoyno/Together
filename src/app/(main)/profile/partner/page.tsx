import { redirect } from "next/navigation";
import { PartnerProfileScreen } from "@/components/features/profile/partner-profile-screen";
import { requireUser } from "@/lib/auth/session";
import { getCoupleContextForUser } from "@/lib/couple/context.server";
import { daysBetween } from "@/lib/dates";
import { signMediaPaths } from "@/lib/media/actions";
import { loadCoupleGallery, loadPartnerFacts } from "@/lib/hub/load-data.server";

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

  const [nicknames, profile, partnerProfile, facts, gallery] = await Promise.all([
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
    supabase
      .from("profiles")
      .select("avatar_path")
      .eq("id", context.partner.id)
      .single(),
    loadPartnerFacts(hubCtx, context.partner.id),
    loadCoupleGallery(hubCtx),
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
      coupleId={context.coupleId}
      daysTogether={daysTogether}
      facts={facts}
      gallery={gallery}
      nicknames={nicknames.data ?? []}
      notificationsEnabled={profile.data?.notifications_enabled ?? true}
      partnerAvatarUrl={partnerAvatarUrl}
      partnerId={context.partner.id}
      partnerName={context.partner.display_name}
      relationshipStartedOn={context.relationshipStartedOn}
      userId={user.id}
    />
  );
}
