import Link from "next/link";
import { redirect } from "next/navigation";
import { InviteLinkDisplay } from "@/components/features/pair/invite-link-display";
import { SkipToDistanceButton } from "@/components/features/onboarding/distance-form";
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
      <h1 className="text-2xl font-bold">Пригласите партнёра</h1>
      <p className="mt-2 text-sm leading-6 text-[var(--muted)]">
        Отправьте ссылку второй половинке — вместе откроется ваше пространство.
      </p>

      {inviteUrl ? (
        <div className="mt-8">
          <InviteLinkDisplay inviteUrl={inviteUrl} />
        </div>
      ) : (
        <section className="mt-8 rounded-3xl surface-panel p-5">
          <p className="text-sm leading-6 text-[var(--muted)]">
            Сначала создайте пару — укажите дату начала отношений.
          </p>
          <Link
            className="mt-4 block w-full rounded-2xl bg-[var(--accent)] px-4 py-3 text-center font-semibold text-white"
            href="/pair"
          >
            Создать пару
          </Link>
        </section>
      )}

      <SkipToDistanceButton />
    </main>
  );
}
