import Link from "next/link";
import { signOut } from "@/app/auth/actions";
import { ExportDataButton } from "@/components/features/profile/export-data-button";
import { PushNotificationsSetup } from "@/components/pwa/push-notifications-setup";
import { PwaInstallHelp } from "@/components/pwa/pwa-install-help";
import { LeaveCoupleButton } from "@/components/features/pair/leave-couple-button";
import { requireUser } from "@/lib/auth/session";
import { getCoupleContext } from "@/lib/couple/context";
import { daysBetween, formatDateRu } from "@/lib/dates";
import { updateProfile } from "@/lib/profile/actions";
import { getPushStatus } from "@/lib/push/actions";
import { getPushServerConfig } from "@/lib/push/config";

export default async function ProfilePage() {
  const { supabase, user } = await requireUser();
  const context = await getCoupleContext(supabase, user.id);

  const { data: profile } = await supabase
    .from("profiles")
    .select("display_name")
    .eq("id", user.id)
    .single();

  const stats = context?.isComplete
    ? await Promise.all([
        supabase
          .from("moods")
          .select("id", { count: "exact", head: true })
          .eq("couple_id", context.coupleId),
        supabase
          .from("plans")
          .select("id", { count: "exact", head: true })
          .eq("couple_id", context.coupleId),
        supabase
          .from("memories")
          .select("id", { count: "exact", head: true })
          .eq("couple_id", context.coupleId),
        supabase
          .from("answers")
          .select("id", { count: "exact", head: true })
          .eq("user_id", user.id),
      ])
    : null;

  const daysTogether =
    context?.relationshipStartedOn ? daysBetween(context.relationshipStartedOn) : null;
  const pushConfig = getPushServerConfig();
  const pushStatus = await getPushStatus();

  return (
    <main className="mx-auto min-h-screen max-w-md px-5 pb-28 pt-8">
      <h1 className="text-3xl font-bold">Профиль</h1>
      <p className="mt-3 leading-7 text-[var(--muted)]">
        Настройки аккаунта, приватность и управление парой.
      </p>

      <section className="mt-8 rounded-3xl border border-[var(--border)] bg-white p-5 shadow-sm">
        <p className="text-sm text-[var(--muted)]">Email</p>
        <p className="mt-1 font-medium">{user.email}</p>
      </section>

      <form action={updateProfile} className="mt-5 grid gap-3 rounded-3xl border border-[var(--border)] bg-white p-5">
        <p className="font-semibold">Имя</p>
        <input
          className="rounded-2xl border border-[var(--border)] px-4 py-3"
          defaultValue={profile?.display_name ?? ""}
          name="displayName"
          required
        />
        {context?.relationshipStartedOn ? (
          <>
            <p className="font-semibold">Дата отношений</p>
            <input
              className="rounded-2xl border border-[var(--border)] px-4 py-3"
              defaultValue={context.relationshipStartedOn}
              name="relationshipStartedOn"
              type="date"
            />
          </>
        ) : null}
        <button className="rounded-2xl bg-[var(--accent)] px-4 py-3 font-semibold text-white" type="submit">
          Сохранить
        </button>
      </form>

      {context?.isComplete ? (
        <>
          <section className="mt-5 rounded-3xl border border-[var(--border)] bg-white p-5">
            <p className="font-semibold">Ваша пара</p>
            <p className="mt-2 text-[var(--muted)]">
              {context.members.map((member) => member.display_name).join(" + ")}
            </p>
            {daysTogether !== null ? (
              <p className="mt-2 text-sm">Вместе {daysTogether} дней</p>
            ) : null}
            {context.relationshipStartedOn ? (
              <p className="mt-1 text-sm text-[var(--muted)]">
                с {formatDateRu(context.relationshipStartedOn)}
              </p>
            ) : null}
          </section>

          <section className="mt-5 rounded-3xl border border-[var(--border)] bg-white p-5">
            <p className="font-semibold">Статистика</p>
            <div className="mt-3 grid grid-cols-2 gap-3 text-sm">
              <p>Настроений: {stats?.[0].count ?? 0}</p>
              <p>Планов: {stats?.[1].count ?? 0}</p>
              <p>Моментов: {stats?.[2].count ?? 0}</p>
              <p>Ответов: {stats?.[3].count ?? 0}</p>
            </div>
          </section>

          <section className="mt-5 rounded-3xl border border-[var(--border)] bg-white p-5">
            <p className="font-semibold">Приватность</p>
            <p className="mt-2 text-sm leading-6 text-[var(--muted)]">
              Данные пары видны только вам двоим. Настроение вы публикуете добровольно.
              Посторонние пользователи не имеют доступа благодаря RLS в Supabase.
            </p>
          </section>

          <div className="mt-5">
            <ExportDataButton />
          </div>

          <div className="mt-5">
            <LeaveCoupleButton variant="complete" />
          </div>
        </>
      ) : context ? (
        <section className="mt-5 grid gap-4 rounded-3xl border border-dashed border-[var(--border)] bg-white p-5">
          <div>
            <p className="font-semibold">Ожидаем партнёра</p>
            <p className="mt-2 text-sm leading-6 text-[var(--muted)]">
              Пара создана, но партнёр ещё не подключился. Отправьте ссылку или отвяжите пару,
              чтобы начать заново.
            </p>
            {context.relationshipStartedOn ? (
              <p className="mt-2 text-sm">с {formatDateRu(context.relationshipStartedOn)}</p>
            ) : null}
          </div>

          <Link className="text-[var(--accent)]" href="/pair">
            Управление приглашением
          </Link>

          <LeaveCoupleButton variant="solo" />
        </section>
      ) : (
        <section className="mt-5 rounded-3xl border border-dashed border-[var(--border)] bg-white p-5">
          <p className="font-semibold">Пара не подключена</p>
          <Link className="mt-3 inline-block text-[var(--accent)]" href="/pair">
            Создать или принять приглашение
          </Link>
        </section>
      )}

      <PwaInstallHelp />

      {context?.isComplete ? (
        <div className="mt-5">
          <PushNotificationsSetup
            initialSubscriptionCount={pushStatus.subscriptionCount}
            serverReady={pushConfig.serverReady}
            serviceRoleConfigured={pushConfig.serviceRoleConfigured}
            vapidConfigured={pushConfig.vapidConfigured}
            vapidPublicKey={pushConfig.vapidPublicKey}
          />
        </div>
      ) : null}

      <section className="mt-5 rounded-3xl border border-[var(--border)] bg-white p-5">
        <p className="font-semibold">Удаление аккаунта</p>
        <p className="mt-2 text-sm leading-6 text-[var(--muted)]">
          Полное удаление выполняется через Supabase Dashboard → Authentication → Users.
          Перед удалением экспортируйте данные и отвяжите пару.
        </p>
      </section>

      <form action={signOut} className="mt-5">
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
