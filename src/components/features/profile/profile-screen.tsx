"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { Heart, Pencil, Settings, Shield, LogOut } from "lucide-react";
import { signOut } from "@/app/auth/actions";
import { ExportDataButton } from "@/components/features/profile/export-data-button";
import { ThemeToggle } from "@/components/features/profile/theme-toggle";
import { PushNotificationsSetup } from "@/components/pwa/push-notifications-setup";
import { PwaInstallHelp } from "@/components/pwa/pwa-install-help";
import { LeaveCoupleButton } from "@/components/features/pair/leave-couple-button";
import { UserAvatar } from "@/components/ui/user-avatar";
import { updateProfile } from "@/lib/profile/actions";

type ProfileScreenProps = {
  email: string;
  displayName: string;
  relationshipStartedOn: string | null;
  partnerName: string | null;
  partnerId: string | null;
  daysTogether: number | null;
  stats: { moods: number; plans: number; memories: number; answers: number } | null;
  isComplete: boolean;
  hasCouple: boolean;
  pushConfig: {
    serverReady: boolean;
    serviceRoleConfigured: boolean;
    vapidConfigured: boolean;
    vapidPublicKey: string | null;
    initialSubscriptionCount: number;
  };
};

type Tab = "settings" | "account";

export function ProfileScreen({
  email,
  displayName,
  relationshipStartedOn,
  partnerName,
  partnerId,
  daysTogether,
  stats,
  isComplete,
  hasCouple,
  pushConfig,
}: ProfileScreenProps) {
  const [tab, setTab] = useState<Tab>("settings");
  const [showEdit, setShowEdit] = useState(false);
  const [name, setName] = useState(displayName);
  const [relationshipDate, setRelationshipDate] = useState(relationshipStartedOn ?? "");
  const [isPending, startTransition] = useTransition();

  function handleSaveProfile(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const formData = new FormData();
    formData.set("displayName", name);
    if (relationshipDate) {
      formData.set("relationshipStartedOn", relationshipDate);
    }

    startTransition(async () => {
      await updateProfile(formData);
      setShowEdit(false);
    });
  }

  return (
    <main className="mx-auto min-h-screen max-w-md px-5 pb-32 pt-8">
      <section className="flex items-center gap-4">
        <UserAvatar name={displayName} size="lg" />
        <div className="min-w-0 flex-1">
          <h1 className="truncate text-2xl font-bold">{displayName}</h1>
          <p className="truncate text-sm text-[var(--muted)]">{email}</p>
        </div>
        <button
          aria-label="Редактировать профиль"
          className="inline-flex items-center gap-1 rounded-2xl surface-input px-3 py-2 text-sm font-semibold"
          onClick={() => setShowEdit(true)}
          type="button"
        >
          <Pencil aria-hidden className="size-4" />
          Редактировать
        </button>
      </section>

      {isComplete && partnerName && partnerId ? (
        <section className="mt-6 flex items-center justify-center gap-4">
          <UserAvatar name={displayName} />
          <Heart aria-hidden className="size-6 fill-[var(--accent)] text-[var(--accent)]" />
          <UserAvatar href="/profile/partner" name={partnerName} />
        </section>
      ) : null}

      {daysTogether !== null ? (
        <p className="mt-4 text-center text-sm text-[var(--muted)]">Вместе {daysTogether} дней</p>
      ) : null}

      <div className="mt-8 flex gap-1 rounded-full bg-[var(--input-bg)] p-1">
        <button
          className={`flex flex-1 items-center justify-center gap-2 rounded-full px-3 py-2 text-sm font-semibold ${
            tab === "settings" ? "bg-[var(--surface)] shadow-sm" : "text-[var(--muted)]"
          }`}
          onClick={() => setTab("settings")}
          type="button"
        >
          <Settings aria-hidden className="size-4" />
          Настройки
        </button>
        <button
          className={`flex flex-1 items-center justify-center gap-2 rounded-full px-3 py-2 text-sm font-semibold ${
            tab === "account" ? "bg-[var(--surface)] shadow-sm" : "text-[var(--muted)]"
          }`}
          onClick={() => setTab("account")}
          type="button"
        >
          <Shield aria-hidden className="size-4" />
          Аккаунт
        </button>
      </div>

      {tab === "settings" ? (
        <section className="mt-5 grid gap-4">
          <ThemeToggle />

          <PwaInstallHelp />

          {isComplete ? (
            <PushNotificationsSetup
              initialSubscriptionCount={pushConfig.initialSubscriptionCount}
              serverReady={pushConfig.serverReady}
              serviceRoleConfigured={pushConfig.serviceRoleConfigured}
              vapidConfigured={pushConfig.vapidConfigured}
              vapidPublicKey={pushConfig.vapidPublicKey}
            />
          ) : null}

          {stats ? (
            <div className="rounded-3xl surface-panel p-5">
              <p className="font-semibold">Статистика</p>
              <div className="mt-3 grid grid-cols-2 gap-3 text-sm">
                <p>Настроений: {stats.moods}</p>
                <p>Планов: {stats.plans}</p>
                <p>Моментов: {stats.memories}</p>
                <p>Ответов: {stats.answers}</p>
              </div>
            </div>
          ) : null}

          {!isComplete && hasCouple ? (
            <div className="rounded-3xl surface-panel border-dashed p-5">
              <p className="font-semibold">Ожидаем партнёра</p>
              <Link className="mt-3 inline-block text-[var(--accent)]" href="/pair">
                Управление приглашением
              </Link>
            </div>
          ) : null}

          {!hasCouple ? (
            <div className="rounded-3xl surface-panel border-dashed p-5">
              <Link className="text-[var(--accent)]" href="/pair">
                Создать или принять приглашение
              </Link>
            </div>
          ) : null}
        </section>
      ) : (
        <section className="mt-5 grid gap-4">
          <ExportDataButton />

          {isComplete ? <LeaveCoupleButton variant="complete" /> : hasCouple ? <LeaveCoupleButton variant="solo" /> : null}

          <div className="rounded-3xl surface-panel p-5">
            <p className="font-semibold">Удаление аккаунта</p>
            <p className="mt-2 text-sm leading-6 text-[var(--muted)]">
              Полное удаление — через Supabase Dashboard. Перед этим экспортируйте данные.
            </p>
          </div>

          <form action={signOut}>
            <button
              className="inline-flex w-full items-center justify-center gap-2 rounded-2xl surface-panel px-5 py-4 font-semibold"
              type="submit"
            >
              <LogOut aria-hidden className="size-5" />
              Выйти
            </button>
          </form>
        </section>
      )}

      {showEdit ? (
        <div className="fixed inset-0 z-50 flex items-end bg-black/40 p-4 pb-[calc(max(0.75rem,env(safe-area-inset-bottom))+5rem)]">
          <form
            className="w-full max-w-md rounded-3xl surface-panel p-5 shadow-xl"
            onSubmit={handleSaveProfile}
          >
            <p className="text-lg font-bold">Редактировать профиль</p>
            <div className="mt-4 grid gap-3">
              <input
                className="rounded-2xl surface-input px-4 py-3"
                onChange={(event) => setName(event.target.value)}
                required
                value={name}
              />
              {relationshipStartedOn !== null ? (
                <input
                  className="rounded-2xl surface-input px-4 py-3"
                  onChange={(event) => setRelationshipDate(event.target.value)}
                  type="date"
                  value={relationshipDate}
                />
              ) : null}
              <button
                className="rounded-2xl bg-[var(--accent)] px-4 py-3 font-semibold text-white disabled:opacity-60"
                disabled={isPending}
                type="submit"
              >
                {isPending ? "Сохраняем..." : "Сохранить"}
              </button>
              <button
                className="rounded-2xl surface-input px-4 py-3 font-semibold"
                onClick={() => setShowEdit(false)}
                type="button"
              >
                Отмена
              </button>
            </div>
          </form>
        </div>
      ) : null}
    </main>
  );
}
