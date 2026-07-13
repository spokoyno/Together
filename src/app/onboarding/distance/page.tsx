import { requireUser } from "@/lib/auth/session";
import { redirect } from "next/navigation";
import { OnboardingDistanceIntro } from "@/components/features/onboarding/onboarding-distance-intro";

export default async function DistanceOnboardingPage() {
  const { supabase, user } = await requireUser();

  const { data: profile } = await supabase
    .from("profiles")
    .select("onboarding_step")
    .eq("id", user.id)
    .maybeSingle();

  if (profile?.onboarding_step === "profile" || !profile?.onboarding_step) {
    redirect("/onboarding/profile");
  }
  if (profile?.onboarding_step === "invite") {
    redirect("/onboarding/invite");
  }
  if (profile?.onboarding_step === "done") {
    redirect("/pair");
  }

  return (
    <main className="mx-auto flex min-h-screen max-w-md flex-col justify-center px-5 py-10">
      <OnboardingDistanceIntro />
    </main>
  );
}
