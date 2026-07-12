import Link from "next/link";
import { redirect } from "next/navigation";
import { AcceptInviteButton } from "@/components/features/pair/accept-invite-button";
import { InviteConflictPanel } from "@/components/features/pair/invite-conflict-panel";
import { requireUser } from "@/lib/auth/session";
import { getCoupleContextForUser } from "@/lib/couple/context.server";
import { validateInvitationToken } from "@/lib/couple/invitation";

type InvitePageProps = {
  params: Promise<{ token: string }>;
};

const INVALID_MESSAGES = {
  invalid: "Ссылка недействительна. Попросите партнёра отправить новую.",
  expired: "Срок действия ссылки истёк. Попросите партнёра создать новую.",
  accepted: "Это приглашение уже использовано.",
  couple_full: "В эту пару уже подключён партнёр.",
} as const;

export default async function InvitePage({ params }: InvitePageProps) {
  const { token } = await params;
  const { supabase, user } = await requireUser();
  const context = await getCoupleContextForUser(user.id);
  const validation = await validateInvitationToken(supabase, token);

  if (context?.isComplete) {
    redirect("/dashboard");
  }

  if (!validation.valid) {
    return (
      <main className="mx-auto min-h-screen max-w-md px-5 py-8">
        <p className="text-sm font-semibold text-[var(--accent)]">Приглашение</p>
        <h1 className="mt-2 text-3xl font-bold">Ссылка недоступна</h1>
        <p className="mt-3 leading-7 text-[var(--muted)]">
          {INVALID_MESSAGES[validation.reason]}
        </p>
        <Link className="mt-6 inline-block text-[var(--accent)]" href="/dashboard">
          На главную
        </Link>
      </main>
    );
  }

  if (context) {
    return (
      <main className="mx-auto min-h-screen max-w-md px-5 py-8">
        <p className="text-sm font-semibold text-[var(--accent)]">Приглашение</p>
        <h1 className="mt-2 text-3xl font-bold">Вы уже в паре</h1>
        <div className="mt-6">
          <InviteConflictPanel isComplete={false} token={token} />
        </div>
      </main>
    );
  }

  return (
    <main className="mx-auto min-h-screen max-w-md px-5 py-8">
      <p className="text-sm font-semibold text-[var(--accent)]">Приглашение</p>
      <h1 className="mt-2 text-3xl font-bold">Присоединиться к паре</h1>
      <p className="mt-3 leading-7 text-[var(--muted)]">
        Партнёр пригласил вас в приватное пространство Together.
      </p>
      <div className="mt-8">
        <AcceptInviteButton token={token} />
      </div>
      <Link className="mt-6 inline-block text-sm text-[var(--muted)]" href="/auth">
        Войти в другой аккаунт
      </Link>
    </main>
  );
}
