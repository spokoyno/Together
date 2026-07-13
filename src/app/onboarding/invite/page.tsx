import { redirect } from "next/navigation";
import { OnboardingInviteIntro } from "@/components/features/onboarding/onboarding-invite-intro";
import { requireUser } from "@/lib/auth/session";
import { createInvitationUrl } from "@/lib/couple/invitation";

export default async function InviteOnboardingPage() {
  const { supabase, user } = await requireUser();

  const { data: profile } = await supabase
    .from("profiles")
    .select("onboarding_step")
    .eq("id", user.id)
    .maybeSingle();

  if (profile?.onboarding_step === "profile" || !profile?.onboarding_step) {
    redirect("/onboarding/profile");
  }
  if (profile?.onboarding_step === "distance") {
    redirect("/onboarding/distance");
  }
  if (profile?.onboarding_step === "done") {
    redirect("/pair");
  }

  const inviteUrl = await createInvitationUrl(supabase);

  return (
    <main className="mx-auto flex min-h-screen max-w-md flex-col justify-center px-5 py-10">
      <OnboardingInviteIntro inviteUrl={inviteUrl} />
    </main>
  );
}
