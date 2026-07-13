import { DashboardHome } from "@/components/features/dashboard/dashboard-home";
import { daysBetween, todayIso } from "@/lib/dates";
import { loadNearestCountdown } from "@/lib/hub/load-data.server";
import { normalizeDashboardPreferences } from "@/lib/hub/panels-preferences";
import { signMediaPaths } from "@/lib/media/actions";
import { getTodayDailyQuestion } from "@/lib/question/actions";
import type { DashboardPanelPreference } from "@/lib/hub/panels-preferences";
import type { CoupleContext } from "@/types/domain";
import type { MoodLevel } from "@/types/domain";
import type { SupabaseClient } from "@supabase/supabase-js";

type DashboardContentProps = {
  supabase: SupabaseClient;
  userId: string;
  context: CoupleContext;
  panelPreferences: DashboardPanelPreference[];
};

export async function DashboardContent({
  supabase,
  userId,
  context,
  panelPreferences,
}: DashboardContentProps) {
  const partner = context.partner;
  if (!partner) {
    return null;
  }

  const me = context.members.find((member) => member.id === userId);
  const today = todayIso();
  const profileIds = [userId, partner.id];

  const daysTogether = context.relationshipStartedOn
    ? daysBetween(context.relationshipStartedOn)
    : null;

  const [profilesResult, myMoodResult, partnerMoodResult, dailyQuestion, nearestCountdown] =
    await Promise.all([
      supabase.from("profiles").select("id, avatar_path, birthday").in("id", profileIds),
      supabase
        .from("moods")
        .select("level, custom_label, custom_emoji")
        .eq("couple_id", context.coupleId)
        .eq("user_id", userId)
        .gte("created_at", `${today}T00:00:00`)
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle(),
      supabase
        .from("moods")
        .select("level, custom_label, custom_emoji")
        .eq("couple_id", context.coupleId)
        .eq("user_id", partner.id)
        .gte("created_at", `${today}T00:00:00`)
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle(),
      getTodayDailyQuestion(supabase, context.coupleId),
      loadNearestCountdown({
        supabase,
        userId,
        coupleId: context.coupleId,
        partnerId: partner.id,
        partnerName: partner.display_name,
      }).catch(() => null),
    ]);

  const signed = await signMediaPaths(
    supabase,
    (profilesResult.data ?? [])
      .map((row) => row.avatar_path)
      .filter((path): path is string => Boolean(path)),
  );

  const myProfile = profilesResult.data?.find((row) => row.id === userId);
  const partnerProfile = profilesResult.data?.find((row) => row.id === partner.id);
  const panels = normalizeDashboardPreferences(panelPreferences);

  return (
    <DashboardHome
      dailyQuestionPrompt={dailyQuestion?.questions?.prompt ?? ""}
      daysTogether={daysTogether}
      myAvatarUrl={myProfile?.avatar_path ? signed[myProfile.avatar_path] ?? null : null}
      myMood={{
        level: (myMoodResult.data?.level as MoodLevel | undefined) ?? null,
        customLabel: myMoodResult.data?.custom_label ?? null,
        customEmoji: myMoodResult.data?.custom_emoji ?? null,
      }}
      myName={me?.display_name ?? ""}
      nearestCountdown={nearestCountdown}
      panelPreferences={panels}
      partnerAvatarUrl={
        partnerProfile?.avatar_path ? signed[partnerProfile.avatar_path] ?? null : null
      }
      partnerMood={{
        level: (partnerMoodResult.data?.level as MoodLevel | undefined) ?? null,
        customLabel: partnerMoodResult.data?.custom_label ?? null,
        customEmoji: partnerMoodResult.data?.custom_emoji ?? null,
      }}
      partnerName={partner.display_name}
    />
  );
}
