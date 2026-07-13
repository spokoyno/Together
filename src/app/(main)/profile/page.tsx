import { ProfileScreen } from "@/components/features/profile/profile-screen";
import { requireUser } from "@/lib/auth/session";
import { getCoupleContextForUser } from "@/lib/couple/context.server";
import { daysBetween } from "@/lib/dates";
import { getPushStatus } from "@/lib/push/actions";
import { getPushServerConfig } from "@/lib/push/config";

export default async function ProfilePage() {
  const { supabase, user } = await requireUser();
  const context = await getCoupleContextForUser(user.id);

  const { data: profile } = await supabase
    .from("profiles")
    .select("display_name")
    .eq("id", user.id)
    .single();

  const stats = context?.isComplete
    ? await Promise.all([
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
      ])
    : null;

  const daysTogether =
    context?.relationshipStartedOn ? daysBetween(context.relationshipStartedOn) : null;
  const pushConfig = getPushServerConfig();
  const pushStatus = await getPushStatus();

  return (
    <ProfileScreen
      daysTogether={daysTogether}
      displayName={profile?.display_name ?? "Пользователь"}
      email={user.email ?? ""}
      hasCouple={Boolean(context)}
      isComplete={Boolean(context?.isComplete)}
      partnerId={context?.partner?.id ?? null}
      partnerName={context?.partner?.display_name ?? null}
      pushConfig={{
        initialSubscriptionCount: pushStatus.subscriptionCount,
        serverReady: pushConfig.serverReady,
        serviceRoleConfigured: pushConfig.serviceRoleConfigured,
        vapidConfigured: pushConfig.vapidConfigured,
        vapidPublicKey: pushConfig.vapidPublicKey,
      }}
      relationshipStartedOn={context?.relationshipStartedOn ?? null}
      stats={
        stats
          ? {
              moods: stats[0].count ?? 0,
              plans: stats[1].count ?? 0,
              memories: stats[2].count ?? 0,
              answers: stats[3].count ?? 0,
            }
          : null
      }
    />
  );
}
