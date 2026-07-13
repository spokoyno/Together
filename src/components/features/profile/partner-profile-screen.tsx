"use client";

import Link from "next/link";
import { useState, useTransition } from "react";
import { ArrowLeft } from "lucide-react";
import { addPartnerNickname, setNotificationsEnabled } from "@/lib/partner/actions";
import { UserAvatar } from "@/components/ui/user-avatar";
import { formatDateRu } from "@/lib/dates";

type NicknameRow = {
  id: string;
  nickname: string;
  created_at: string;
};

type PartnerProfileScreenProps = {
  partnerName: string;
  partnerAvatarUrl?: string | null;
  partnerId: string;
  relationshipStartedOn: string | null;
  daysTogether: number | null;
  stats: { moods: number; plans: number; memories: number; answers: number };
  nicknames: NicknameRow[];
  notificationsEnabled: boolean;
};

export function PartnerProfileScreen({
  partnerName,
  partnerAvatarUrl,
  partnerId,
  relationshipStartedOn,
  daysTogether,
  stats,
  nicknames,
  notificationsEnabled,
}: PartnerProfileScreenProps) {
  const [nickname, setNickname] = useState("");
  const [notifications, setNotifications] = useState(notificationsEnabled);
  const [error, setError] = useState("");
  const [isPending, startTransition] = useTransition();

  function handleNickname(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");

    const formData = new FormData();
    formData.set("nickname", nickname);
    formData.set("targetUserId", partnerId);

    startTransition(async () => {
      const result = await addPartnerNickname(formData);
      if (!result.ok) {
        setError(result.error ?? "Не удалось сохранить.");
        return;
      }
      setNickname("");
    });
  }

  function handleNotifications(enabled: boolean) {
    setNotifications(enabled);
    startTransition(async () => {
      await setNotificationsEnabled(enabled);
    });
  }

  return (
    <main className="mx-auto min-h-screen max-w-md px-5 pb-32 pt-8">
      <Link
        className="inline-flex items-center gap-2 text-sm font-semibold text-[var(--muted)]"
        href="/profile"
      >
        <ArrowLeft aria-hidden className="size-4" />
        Назад
      </Link>

      <section className="mt-6 flex flex-col items-center text-center">
        <UserAvatar imageUrl={partnerAvatarUrl} name={partnerName} size="lg" />
        <h1 className="mt-4 text-2xl font-bold">{partnerName}</h1>
        {relationshipStartedOn ? (
          <p className="mt-2 text-sm text-[var(--muted)]">
            Вместе с {formatDateRu(relationshipStartedOn)}
            {daysTogether !== null ? ` · ${daysTogether} дней` : ""}
          </p>
        ) : null}
      </section>

      <section className="mt-8 rounded-3xl surface-panel p-5">
        <p className="font-semibold">Статистика пары</p>
        <div className="mt-3 grid grid-cols-2 gap-3 text-sm">
          <p>Настроений: {stats.moods}</p>
          <p>Планов: {stats.plans}</p>
          <p>Моментов: {stats.memories}</p>
          <p>Ответов: {stats.answers}</p>
        </div>
      </section>

      <section className="mt-5 rounded-3xl surface-panel p-5">
        <p className="font-semibold">Прозвища (AKA)</p>
        <form className="mt-3 grid gap-2" onSubmit={handleNickname}>
          <input
            className="rounded-2xl surface-input px-4 py-3"
            onChange={(event) => setNickname(event.target.value)}
            placeholder="Новое прозвище"
            value={nickname}
          />
          {error ? <p className="alert-error rounded-xl px-3 py-2 text-sm">{error}</p> : null}
          <button
            className="rounded-2xl bg-[var(--accent)] px-4 py-3 font-semibold text-white disabled:opacity-60"
            disabled={isPending || !nickname.trim()}
            type="submit"
          >
            Сохранить прозвище
          </button>
        </form>

        {nicknames.length ? (
          <ul className="mt-4 space-y-2">
            {nicknames.map((row) => (
              <li className="rounded-xl surface-input px-3 py-2 text-sm" key={row.id}>
                <span className="font-medium">{row.nickname}</span>
                <span className="ml-2 text-[var(--muted)]">
                  · {formatDateRu(row.created_at.slice(0, 10))}
                </span>
              </li>
            ))}
          </ul>
        ) : (
          <p className="mt-3 text-sm text-[var(--muted)]">Прозвищ пока нет — добавьте первое.</p>
        )}
      </section>

      <section className="mt-5 rounded-3xl surface-panel p-5">
        <label className="flex items-center justify-between">
          <div>
            <p className="font-semibold">Уведомления</p>
            <p className="mt-1 text-sm text-[var(--muted)]">По умолчанию включены для всех</p>
          </div>
          <input
            checked={notifications}
            className="size-5 accent-[var(--accent)]"
            onChange={(event) => handleNotifications(event.target.checked)}
            type="checkbox"
          />
        </label>
      </section>
    </main>
  );
}
