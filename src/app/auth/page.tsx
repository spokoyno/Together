import { AuthForm } from "@/components/features/auth/auth-form";
import { getPostAuthPath } from "@/lib/auth/routes";
import { getSessionUser } from "@/lib/auth/session";

type AuthPageProps = {
  searchParams: Promise<{
    error?: string;
    mode?: string;
    next?: string;
  }>;
};

const callbackErrorMessage =
  "Не удалось подтвердить вход. Попробуйте снова или запросите новую ссылку.";

function sanitizeNextPath(value: string | undefined): string {
  if (!value || !value.startsWith("/") || value.startsWith("//")) {
    return "/dashboard";
  }
  return value;
}

export default async function AuthPage({ searchParams }: AuthPageProps) {
  const params = await searchParams;
  const initialError = params.error === "callback" ? callbackErrorMessage : null;
  const initialMode = params.mode === "signup" ? "signup" : "signin";

  const { supabase, user } = await getSessionUser();
  const defaultNext = user
    ? await getPostAuthPath(supabase, user.id)
    : "/dashboard";
  const nextPath = sanitizeNextPath(params.next ?? defaultNext);

  return (
    <main className="mx-auto min-h-screen max-w-md px-5 py-8">
      <p className="text-sm font-semibold text-[var(--accent)]">Together</p>
      <h1 className="mt-2 text-3xl font-bold">Войдите в своё пространство</h1>
      <p className="mt-3 leading-7 text-[var(--muted)]">
        Регистрация и вход для двоих. Сессия сохраняется на устройстве.
      </p>

      <div className="mt-8">
        <AuthForm
          initialError={initialError}
          initialMode={initialMode}
          nextPath={nextPath}
        />
      </div>
    </main>
  );
}
