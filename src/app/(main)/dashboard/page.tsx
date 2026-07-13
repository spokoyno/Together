import { redirect } from "next/navigation";
import { DashboardHome } from "@/components/features/dashboard/dashboard-home";
import { DashboardTopBanners } from "@/components/features/dashboard/dashboard-top-banners";
import { PairWaitingPanel } from "@/components/features/pair/pair-waiting-panel";
import { requireUser } from "@/lib/auth/session";
import { getOnboardingPath } from "@/lib/auth/routes";
import { getCoupleContextForUser } from "@/lib/couple/context.server";
import { createInvitationUrl } from "@/lib/couple/invitation";
import { daysBetween, greeting, todayIso } from "@/lib/dates";
import { loadNearestCountdown } from "@/lib/hub/load-data.server";
import { getOrCreateDailyQuestion } from "@/lib/question/actions";
import { getPushStatus } from "@/lib/push/actions";
import { getPushServerConfig } from "@/lib/push/config";
import { signMediaPaths } from "@/lib/media/actions";
import type { OnboardingStep } from "@/lib/onboarding/actions";
import type { DashboardPanelPreference } from "@/lib/hub/panels";
import { normalizeDashboardPreferences } from "@/lib/hub/panels";
import type { MoodLevel } from "@/types/domain";

export default async function DashboardPage() {
  const { supabase, user } = await requireUser();
  const context = await getCoupleContextForUser(user.id);
  const pushConfig = getPushServerConfig();
  const pushStatus = await getPushStatus();
  const today = todayIso();

  const { data: profileSettings, error: profileError } = await supabase
    .from("profiles")
    .select("notifications_enabled, birthday, dashboard_panels, onboarding_step")
    .eq("id", user.id)
    .maybeSingle();

  if (profileError && profileError.code !== "42703") {
    throw profileError;
  }

  const { data: profileFallback } = profileError
    ? await supabase
        .from("profiles")
        .select("notifications_enabled, birthday")
        .eq("id", user.id)
        .maybeSingle()
    : { data: profileSettings };

  const onboardingStep =
    (profileSettings?.onboarding_step as OnboardingStep | null | undefined) ??
    (profileFallback?.birthday ? "done" : "profile");

  if (onboardingStep !== "done") {
    redirect(getOnboardingPath(onboardingStep));
  }

  const profileNotificationsEnabled = profileFallback?.notifications_enabled ?? true;

  if (!context) {
    redirect("/pair");
  }

  if (!context.isComplete) {
    const inviteUrl = await createInvitationUrl(supabase);

    return (
      <main className="mx-auto min-h-screen max-w-md px-5 pb-28 pt-7">
        <DashboardTopBanners
          initialSubscriptionCount={pushStatus.subscriptionCount}
          profileNotificationsEnabled={profileNotificationsEnabled}
          vapidPublicKey={pushConfig.vapidPublicKey}
        />
        <header>
          <p className="text-sm text-[var(--muted)]">{greeting()}</p>
          <h1 className="text-2xl font-bold">Together</h1>
        </header>

        <section className="mt-7 rounded-3xl surface-panel border-dashed p-5">
          <p className="text-sm font-semibold text-[var(--accent)]">Почти готово</p>
          <p className="mt-2 leading-7 text-[var(--muted)]">
            Приложение откроется полностью, когда партнёр примет приглашение.
          </p>
        </section>

        <div className="mt-6">
          <PairWaitingPanel
            inviteUrl={inviteUrl}
            relationshipStartedOn={context.relationshipStartedOn}
          />
        </div>
      </main>
    );
  }

  const me = context.members.find((member) => member.id === user.id);
  const partner = context.partner;

  if (!partner) {
    redirect("/pair");
  }

  const daysTogether = context.relationshipStartedOn
    ? daysBetween(context.relationshipStartedOn)
    : null;

  const profileIds = [user.id, partner?.id].filter(Boolean) as string[];

  const [profilesResult, myMoodResult, partnerMoodResult, dailyQuestion] = await Promise.all([
    supabase.from("profiles").select("id, avatar_path, birthday").in("id", profileIds),
    supabase
      .from("moods")
      .select("level")
      .eq("couple_id", context.coupleId)
      .eq("user_id", user.id)
      .gte("created_at", `${today}T00:00:00`)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle(),
    partner
      ? supabase
          .from("moods")
          .select("level")
          .eq("couple_id", context.coupleId)
          .eq("user_id", partner.id)
          .gte("created_at", `${today}T00:00:00`)
          .order("created_at", { ascending: false })
          .limit(1)
          .maybeSingle()
      : Promise.resolve({ data: null }),
    getOrCreateDailyQuestion(supabase, context.coupleId),
  ]);

  const signed = await signMediaPaths(
    supabase,
    (profilesResult.data ?? [])
      .map((row) => row.avatar_path)
      .filter((path): path is string => Boolean(path)),
  );

  const myProfile = profilesResult.data?.find((row) => row.id === user.id);
  const partnerProfile = partner
    ? profilesResult.data?.find((row) => row.id === partner.id)
    : null;

  const panelPreferences = normalizeDashboardPreferences(
    (profileSettings?.dashboard_panels as DashboardPanelPreference[] | null) ?? [],
  );

  const nearestCountdown = partner
    ? await loadNearestCountdown({
        supabase,
        userId: user.id,
        coupleId: context.coupleId,
        partnerId: partner.id,
        partnerName: partner.display_name,
      })
    : null;

  return (
    <main className="mx-auto min-h-screen max-w-md px-5 pb-28 pt-7">
      <DashboardTopBanners
        initialSubscriptionCount={pushStatus.subscriptionCount}
        profileNotificationsEnabled={profileNotificationsEnabled}
        vapidPublicKey={pushConfig.vapidPublicKey}
      />

      {partner ? (
        <DashboardHome
          dailyQuestionPrompt={dailyQuestion?.questions?.prompt ?? "Вопросы скоро появятся"}
          daysTogether={daysTogether}
          myAvatarUrl={myProfile?.avatar_path ? signed[myProfile.avatar_path] ?? null : null}
          myMood={(myMoodResult.data?.level as MoodLevel | undefined) ?? null}
          myName={me?.display_name ?? "Вы"}
          nearestCountdown={nearestCountdown}
          panelPreferences={panelPreferences}
          partnerAvatarUrl={
            partnerProfile?.avatar_path ? signed[partnerProfile.avatar_path] ?? null : null
          }
          partnerMood={(partnerMoodResult.data?.level as MoodLevel | undefined) ?? null}
          partnerName={partner.display_name}
        />
      ) : null}
    </main>
  );
}
