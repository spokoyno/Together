import { requireUser } from "@/lib/auth/session";
import { redirect } from "next/navigation";
import { ProfileOnboardingForm } from "@/components/features/onboarding/profile-form";
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
      <h1 className="text-2xl font-bold">Ваш профиль</h1>
      <p className="mt-2 text-sm leading-6 text-[var(--muted)]">
        Расскажите немного о себе — имя, пол и день рождения появятся в календаре праздников.
      </p>
      <ProfileOnboardingForm
        displayName={profile?.display_name ?? "Пользователь"}
        initialGender={(profile?.gender as ProfileGender | null) ?? null}
      />
    </main>
  );
}
