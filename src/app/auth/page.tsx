import Link from "next/link";
import { AuthForm } from "@/components/features/auth/auth-form";

type AuthPageProps = {
  searchParams: Promise<{ error?: string }>;
};

const callbackErrorMessage =
  "Не удалось подтвердить вход. Попробуйте снова или запросите новую ссылку.";

export default async function AuthPage({ searchParams }: AuthPageProps) {
  const params = await searchParams;
  const initialError = params.error === "callback" ? callbackErrorMessage : null;

  return (
    <main className="mx-auto min-h-screen max-w-md px-5 py-8">
      <Link className="text-sm text-[var(--accent)]" href="/">
        ← На главную
      </Link>
      <p className="mt-6 text-sm font-semibold text-[var(--accent)]">Аккаунт</p>
      <h1 className="mt-2 text-3xl font-bold">Начните своё пространство</h1>
      <p className="mt-3 leading-7 text-[var(--muted)]">
        Создайте аккаунт или войдите, чтобы сохранять планы, настроение и воспоминания.
      </p>

      <div className="mt-8">
        <AuthForm initialError={initialError} />
      </div>
    </main>
  );
}
