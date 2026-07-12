import Link from "next/link";
import { redirect } from "next/navigation";
import { AcceptInviteButton } from "@/components/features/pair/accept-invite-button";
import { requireUser } from "@/lib/auth/session";
import { getCoupleContext } from "@/lib/couple/context";

type InvitePageProps = {
  params: Promise<{ token: string }>;
};

export default async function InvitePage({ params }: InvitePageProps) {
  const { token } = await params;
  const { supabase, user } = await requireUser();
  const context = await getCoupleContext(supabase, user.id);

  if (context?.isComplete) {
    redirect("/dashboard");
  }

  if (context) {
    return (
      <main className="mx-auto min-h-screen max-w-md px-5 py-8">
        <h1 className="text-3xl font-bold">Вы уже в паре</h1>
        <p className="mt-3 leading-7 text-[var(--muted)]">
          Сначала отвяжите текущую пару в профиле, если хотите принять другое приглашение.
        </p>
        <Link className="mt-6 inline-block text-[var(--accent)]" href="/profile">
          Перейти в профиль
        </Link>
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
