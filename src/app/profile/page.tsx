import Link from "next/link";
import { redirect } from "next/navigation";
import { signOut } from "@/app/auth/actions";
import { createClient } from "@/lib/supabase/server";

export default async function ProfilePage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/auth");
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("display_name")
    .eq("id", user.id)
    .maybeSingle();

  return (
    <main className="mx-auto min-h-screen max-w-md px-5 py-8">
      <Link className="text-sm text-[var(--accent)]" href="/dashboard">
        ← Назад
      </Link>
      <h1 className="mt-5 text-3xl font-bold">Профиль</h1>
      <p className="mt-3 leading-7 text-[var(--muted)]">
        Вы вошли в аккаунт. Дальше здесь появятся настройки пары и приватности.
      </p>

      <section className="mt-8 rounded-3xl border border-[var(--border)] bg-white p-5 shadow-sm">
        <p className="text-sm text-[var(--muted)]">Имя</p>
        <p className="mt-1 text-xl font-bold">
          {profile?.display_name ?? "Пользователь"}
        </p>
        <p className="mt-4 text-sm text-[var(--muted)]">Email</p>
        <p className="mt-1 font-medium">{user.email}</p>
      </section>

      <form action={signOut} className="mt-6">
        <button
          className="w-full rounded-2xl border border-[var(--border)] bg-white px-5 py-4 font-semibold"
          type="submit"
        >
          Выйти
        </button>
      </form>
    </main>
  );
}
