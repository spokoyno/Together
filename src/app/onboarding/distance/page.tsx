import { requireUser } from "@/lib/auth/session";
import { redirect } from "next/navigation";
import { DistanceOnboardingForm } from "@/components/features/onboarding/distance-form";

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
      <h1 className="text-2xl font-bold">Как вы сейчас?</h1>
      <p className="mt-2 text-sm leading-6 text-[var(--muted)]">
        Это поможет подстроить подсказки и разделы под ваш формат отношений.
      </p>
      <DistanceOnboardingForm />
    </main>
  );
}
