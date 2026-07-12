import { redirect } from "next/navigation";
import { UpdatePasswordForm } from "@/components/features/auth/update-password-form";
import { getSessionUser } from "@/lib/auth/session";

export default async function UpdatePasswordPage() {
  const { user } = await getSessionUser();

  if (!user) {
    redirect("/auth?error=callback");
  }

  return (
    <main className="mx-auto min-h-screen max-w-md px-5 py-8">
      <p className="text-sm font-semibold text-[var(--accent)]">Новый пароль</p>
      <h1 className="mt-2 text-3xl font-bold">Придумайте новый пароль</h1>
      <p className="mt-3 leading-7 text-[var(--muted)]">
        После сохранения вы сразу попадёте в приложение.
      </p>
      <UpdatePasswordForm />
    </main>
  );
}
