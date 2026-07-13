import { Suspense } from "react";
import { redirect } from "next/navigation";
import { DashboardContent } from "@/components/features/dashboard/dashboard-content";
import { DashboardTopBanners } from "@/components/features/dashboard/dashboard-top-banners";
import { DashboardGreeting } from "@/components/features/dashboard/dashboard-greeting";
import { DashboardWaitingState } from "@/components/features/dashboard/dashboard-waiting-state";
import { TabPageSkeleton } from "@/components/ui/tab-page-skeleton";
import { requireUser } from "@/lib/auth/session";
import { getOnboardingPath } from "@/lib/auth/routes";
import { getCoupleContextForUser } from "@/lib/couple/context.server";
import { createInvitationUrl } from "@/lib/couple/invitation";
import { normalizeDashboardPreferences } from "@/lib/hub/panels-preferences";
import { getPushServerConfig } from "@/lib/push/config";
import type { OnboardingStep } from "@/lib/onboarding/actions";
import type { DashboardPanelPreference } from "@/lib/hub/panels-preferences";

export default async function DashboardPage() {
  const { supabase, user } = await requireUser();
  const context = await getCoupleContextForUser(user.id);
  const pushConfig = getPushServerConfig();

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

  const { count: pushSubscriptionCount } = await supabase
    .from("push_subscriptions")
    .select("id", { count: "exact", head: true })
    .eq("user_id", user.id);

  if (!context) {
    redirect("/pair");
  }

  if (!context.isComplete) {
    const inviteUrl = await createInvitationUrl(supabase);

    return (
      <main className="mx-auto min-h-screen max-w-md px-5 pb-28 pt-7">
        <DashboardTopBanners
          initialSubscriptionCount={pushSubscriptionCount ?? 0}
          profileNotificationsEnabled={profileNotificationsEnabled}
          vapidPublicKey={pushConfig.vapidPublicKey}
        />
        <DashboardGreeting />

        <section className="mt-7">
          <DashboardWaitingState
            inviteUrl={inviteUrl}
            relationshipStartedOn={context.relationshipStartedOn}
          />
        </section>
      </main>
    );
  }

  const partner = context.partner;

  if (!partner) {
    redirect("/pair");
  }

  const panelPreferences = normalizeDashboardPreferences(
    (profileSettings?.dashboard_panels as DashboardPanelPreference[] | null) ?? [],
  );

  return (
    <main className="mx-auto min-h-screen max-w-md px-5 pb-28 pt-7">
      <DashboardTopBanners
        initialSubscriptionCount={pushSubscriptionCount ?? 0}
        profileNotificationsEnabled={profileNotificationsEnabled}
        vapidPublicKey={pushConfig.vapidPublicKey}
      />

      <Suspense fallback={<TabPageSkeleton />}>
        <DashboardContent
          context={context}
          panelPreferences={panelPreferences}
          supabase={supabase}
          userId={user.id}
        />
      </Suspense>
    </main>
  );
}
