import type { SupabaseClient } from "@supabase/supabase-js";
import type { OnboardingStep } from "@/lib/onboarding/actions";

export function getOnboardingPath(step: OnboardingStep | null | undefined): string {
  if (step === "invite") {
    return "/onboarding/invite";
  }
  if (step === "distance") {
    return "/onboarding/distance";
  }
  if (step === "done") {
    return "/dashboard";
  }
  return "/onboarding/profile";
}

export async function getPostAuthPath(
  supabase: SupabaseClient,
  userId: string,
): Promise<string> {
  const [{ data: profile }, { data: membership }] = await Promise.all([
    supabase
      .from("profiles")
      .select("onboarding_step, birthday")
      .eq("id", userId)
      .maybeSingle(),
    supabase.from("couple_members").select("couple_id").eq("user_id", userId).maybeSingle(),
  ]);

  const step = (profile?.onboarding_step as OnboardingStep | null) ??
    (profile?.birthday ? "done" : "profile");

  if (step !== "done") {
    return getOnboardingPath(step);
  }

  return membership ? "/dashboard" : "/pair";
}

export { getAppUrl } from "@/lib/config/app-url";
export { isAuthPublicPath, isProtectedPath } from "@/lib/auth/paths";
