import Link from "next/link";
import { redirect } from "next/navigation";
import { CreateCoupleForm } from "@/components/features/pair/create-couple-form";
import { PairWaitingPanel } from "@/components/features/pair/pair-waiting-panel";
import { requireUser } from "@/lib/auth/session";
import { getCoupleContextForUser } from "@/lib/couple/context.server";
import { createInvitationUrl } from "@/lib/couple/invitation";

export default async function PairPage() {
  const { supabase, user } = await requireUser();
  const context = await getCoupleContextForUser(user.id);

  if (context?.isComplete) {
    redirect("/dashboard");
  }

  const inviteUrl =
    context && !context.isComplete ? await createInvitationUrl(supabase) : null;

  return (
    <main className="mx-auto min-h-screen max-w-md px-5 py-8">
      <div className="flex items-center justify-between">
        <Link className="text-sm text-[var(--accent)]" href="/profile">
          Профиль
        </Link>
        {context ? (
          <Link className="text-sm text-[var(--muted)]" href="/dashboard">
            Главная
          </Link>
        ) : null}
      </div>

      {!context ? (
        <>
          <p className="mt-6 text-sm font-semibold text-[var(--accent)]">Пара</p>
          <h1 className="mt-2 text-3xl font-bold">Создайте ваше пространство</h1>
          <p className="mt-3 leading-7 text-[var(--muted)]">
            Укажите дату начала отношений — сразу получите ссылку для партнёра.
          </p>

          <CreateCoupleForm />
        </>
      ) : (
        <div className="mt-6">
          <PairWaitingPanel
            inviteUrl={inviteUrl}
            relationshipStartedOn={context.relationshipStartedOn}
            showDashboardLink
            showProfileLink
          />
        </div>
      )}
    </main>
  );
}
