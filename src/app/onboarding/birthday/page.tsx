import { createClient } from "@/lib/supabase/server";
import { requireUser } from "@/lib/auth/session";
import { redirect } from "next/navigation";
import { BirthdayForm } from "@/components/features/onboarding/birthday-form";

export default async function BirthdayOnboardingPage() {
  const { supabase, user } = await requireUser();

  const { data: profile } = await supabase
    .from("profiles")
    .select("birthday, display_name")
    .eq("id", user.id)
    .maybeSingle();

  if (profile?.birthday) {
    redirect("/dashboard");
  }

  return (
    <main className="mx-auto flex min-h-screen max-w-md flex-col justify-center px-5 py-10">
      <h1 className="text-2xl font-bold">Дата рождения</h1>
      <p className="mt-2 text-sm leading-6 text-[var(--muted)]">
        Укажите день рождения — мы отметим его в календаре праздников вместе с партнёром.
      </p>
      <BirthdayForm displayName={profile?.display_name ?? "Пользователь"} />
    </main>
  );
}
