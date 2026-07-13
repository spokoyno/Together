import { requireUser } from "@/lib/auth/session";
import { redirect } from "next/navigation";
import { OnboardingProfileIntro } from "@/components/features/onboarding/onboarding-profile-intro";
import type { ProfileGender } from "@/types/domain";

export default async function ProfileOnboardingPage() {
  const { supabase, user } = await requireUser();

  const { data: profile } = await supabase
    .from("profiles")
    .select("display_name, birthday, gender, onboarding_step")
    .eq("id", user.id)
    .maybeSingle();

  if (profile?.onboarding_step === "done" || profile?.onboarding_step === "invite") {
    redirect("/onboarding/invite");
  }
  if (profile?.onboarding_step === "distance") {
    redirect("/onboarding/distance");
  }

  return (
    <main className="mx-auto flex min-h-screen max-w-md flex-col justify-center px-5 py-10">
      <OnboardingProfileIntro
        displayName={profile?.display_name ?? ""}
        initialGender={(profile?.gender as ProfileGender | null) ?? null}
      />
    </main>
  );
}
