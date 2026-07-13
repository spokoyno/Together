import { AuthPageIntro } from "@/components/features/auth/auth-page-intro";
import { getPostAuthPath } from "@/lib/auth/routes";
import { getSessionUser } from "@/lib/auth/session";

type AuthPageProps = {
  searchParams: Promise<{
    error?: string;
    mode?: string;
    next?: string;
  }>;
};

function sanitizeNextPath(value: string | undefined): string {
  if (!value || !value.startsWith("/") || value.startsWith("//")) {
    return "/dashboard";
  }
  return value;
}

export default async function AuthPage({ searchParams }: AuthPageProps) {
  const params = await searchParams;
  const initialError = params.error === "callback" ? "callback" : null;
  const initialMode = params.mode === "signup" ? "signup" : "signin";

  const { supabase, user } = await getSessionUser();
  const defaultNext = user ? await getPostAuthPath(supabase, user.id) : "/dashboard";
  const nextPath = sanitizeNextPath(params.next ?? defaultNext);

  return (
    <main className="mx-auto min-h-screen max-w-md px-5 py-8">
      <AuthPageIntro
        initialError={initialError}
        initialMode={initialMode}
        nextPath={nextPath}
      />
    </main>
  );
}
