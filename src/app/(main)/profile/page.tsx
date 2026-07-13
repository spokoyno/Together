import { ProfileScreen } from "@/components/features/profile/profile-screen";
import { requireUser } from "@/lib/auth/session";
import { getCoupleContextForUser } from "@/lib/couple/context.server";
import { daysBetween } from "@/lib/dates";
import { signMediaPaths } from "@/lib/media/actions";
import { loadNotifications } from "@/lib/notifications/actions";
import { getPushStatus } from "@/lib/push/actions";
import { getPushServerConfig } from "@/lib/push/config";

export default async function ProfilePage() {
  const { supabase, user } = await requireUser();
  const context = await getCoupleContextForUser(user.id);

  const profileIds = [user.id, context?.partner?.id].filter(Boolean) as string[];
  const { data: profiles } = await supabase
    .from("profiles")
    .select("id, display_name, avatar_path")
    .in("id", profileIds);

  const myProfile = profiles?.find((row) => row.id === user.id);
  const partnerProfile = context?.partner
    ? profiles?.find((row) => row.id === context.partner!.id)
    : null;

  const signed = await signMediaPaths(
    supabase,
    [myProfile?.avatar_path, partnerProfile?.avatar_path].filter((path): path is string =>
      Boolean(path),
    ),
  );

  const avatarUrl = myProfile?.avatar_path ? signed[myProfile.avatar_path] ?? null : null;
  const partnerAvatarUrl = partnerProfile?.avatar_path
    ? signed[partnerProfile.avatar_path] ?? null
    : null;

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
  const notifications = await loadNotifications(supabase, user.id);

  return (
    <ProfileScreen
      avatarUrl={avatarUrl}
      daysTogether={daysTogether}
      displayName={myProfile?.display_name ?? "Пользователь"}
      email={user.email ?? ""}
      hasCouple={Boolean(context)}
      isComplete={Boolean(context?.isComplete)}
      partnerAvatarUrl={partnerAvatarUrl}
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
      notifications={notifications}
      userId={user.id}
    />
  );
}
