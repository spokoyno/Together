"use client";

import Link from "next/link";
import { Pencil, Plus } from "lucide-react";
import { useState, useTransition } from "react";
import { ArrowLeft } from "lucide-react";
import { addPartnerNickname, setNotificationsEnabled } from "@/lib/partner/actions";
import { addPartnerFact } from "@/lib/hub/extended-actions";
import { UserAvatar } from "@/components/ui/user-avatar";
import { formatDateRu } from "@/lib/dates";
import { genderLabel } from "@/lib/profile/gender";
import { resolvePartnerDisplayName } from "@/lib/partner/display-name";
import type { ProfileGender } from "@/types/domain";

type NicknameRow = {
  id: string;
  nickname: string;
  created_at: string;
};

type PartnerFact = {
  id: string;
  trait: string;
  description: string;
  author_name: string;
};

type PartnerProfileScreenProps = {
  partnerName: string;
  activeNickname: string | null;
  partnerGender: ProfileGender | null;
  partnerAvatarUrl?: string | null;
  partnerId: string;
  relationshipStartedOn: string | null;
  daysTogether: number | null;
  nicknames: NicknameRow[];
  notificationsEnabled: boolean;
  facts: PartnerFact[];
};

export function PartnerProfileScreen({
  partnerName,
  activeNickname,
  partnerGender,
  partnerAvatarUrl,
  partnerId,
  relationshipStartedOn,
  daysTogether,
  nicknames,
  notificationsEnabled,
  facts,
}: PartnerProfileScreenProps) {
  const [nicknameDraft, setNicknameDraft] = useState(activeNickname ?? "");
  const [editingNickname, setEditingNickname] = useState(false);
  const displayName = resolvePartnerDisplayName(partnerName, activeNickname);
  const [showFactForm, setShowFactForm] = useState(false);
  const [trait, setTrait] = useState("");
  const [description, setDescription] = useState("");
  const [error, setError] = useState("");
  const [notifications, setNotifications] = useState(notificationsEnabled);
  const [isPending, startTransition] = useTransition();

  function handleNickname(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");

    const formData = new FormData();
    formData.set("nickname", nicknameDraft);
    formData.set("targetUserId", partnerId);

    startTransition(async () => {
      const result = await addPartnerNickname(formData);
      if (!result.ok) {
        setError(result.error ?? "Не удалось сохранить.");
        return;
      }
      setEditingNickname(false);
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
        <UserAvatar imageUrl={partnerAvatarUrl} name={displayName} size="lg" />
        <div className="mt-4 flex items-center justify-center gap-2">
          <h1 className="text-2xl font-bold">{displayName}</h1>
          <button
            aria-label="Изменить прозвище"
            className="grid size-9 place-items-center rounded-full surface-input"
            onClick={() => {
              setNicknameDraft(activeNickname ?? "");
              setEditingNickname((current) => !current);
            }}
            type="button"
          >
            <Pencil aria-hidden className="size-4" />
          </button>
        </div>
        {activeNickname ? (
          <p className="mt-1 text-sm text-[var(--muted)]">Имя в профиле: {partnerName}</p>
        ) : null}
        {genderLabel(partnerGender) ? (
          <p className="mt-1 text-sm text-[var(--muted)]">{genderLabel(partnerGender)}</p>
        ) : null}
        {relationshipStartedOn ? (
          <p className="mt-2 text-sm text-[var(--muted)]">
            Вместе с {formatDateRu(relationshipStartedOn)}
            {daysTogether !== null ? ` · ${daysTogether} дней` : ""}
          </p>
        ) : null}
      </section>

      {editingNickname ? (
        <form className="mt-5 grid gap-2 rounded-3xl surface-panel p-5" onSubmit={handleNickname}>
          <p className="font-semibold">Прозвище</p>
          <input
            className="rounded-2xl surface-input px-4 py-3"
            onChange={(event) => setNicknameDraft(event.target.value)}
            placeholder="Как называть партнёра?"
            value={nicknameDraft}
          />
          {error ? <p className="alert-error rounded-xl px-3 py-2 text-sm">{error}</p> : null}
          <button
            className="rounded-2xl bg-[var(--accent)] px-4 py-3 font-semibold text-white disabled:opacity-60"
            disabled={isPending || !nicknameDraft.trim()}
            type="submit"
          >
            Сохранить
          </button>
        </form>
      ) : null}

      {nicknames.length ? (
        <section className="mt-5 rounded-3xl surface-panel p-5">
          <p className="font-semibold">История прозвищ</p>
          <ul className="mt-3 space-y-2">
            {nicknames.map((row) => (
              <li className="rounded-xl surface-input px-3 py-2 text-sm" key={row.id}>
                <span className="font-medium">{row.nickname}</span>
                <span className="ml-2 text-[var(--muted)]">
                  · {formatDateRu(row.created_at.slice(0, 10))}
                </span>
              </li>
            ))}
          </ul>
        </section>
      ) : null}

      <section className="mt-8 rounded-3xl surface-panel p-5">
        <div className="flex items-center justify-between gap-3">
          <p className="font-semibold">О партнёре</p>
          <button
            aria-label="Добавить факт"
            className="grid size-10 place-items-center rounded-full bg-[var(--accent-soft)] text-[var(--accent)]"
            onClick={() => setShowFactForm((current) => !current)}
            type="button"
          >
            <Plus aria-hidden className="size-5" />
          </button>
        </div>

        {showFactForm ? (
          <form
            className="mt-3 grid gap-2"
            onSubmit={(event) => {
              event.preventDefault();
              setError("");
              startTransition(async () => {
                const result = await addPartnerFact(partnerId, trait, description);
                if (!result.ok) {
                  setError(result.error ?? "Не удалось сохранить.");
                  return;
                }
                setTrait("");
                setDescription("");
                setShowFactForm(false);
              });
            }}
          >
            <input
              className="rounded-2xl surface-input px-4 py-3"
              onChange={(event) => setTrait(event.target.value)}
              placeholder="Характеристика, напр. любимый цвет"
              value={trait}
            />
            <input
              className="rounded-2xl surface-input px-4 py-3"
              onChange={(event) => setDescription(event.target.value)}
              placeholder="Описание, напр. красный"
              value={description}
            />
            <button
              className="rounded-2xl bg-[var(--accent)] px-4 py-3 font-semibold text-white disabled:opacity-60"
              disabled={isPending || !trait.trim() || !description.trim()}
              type="submit"
            >
              Сохранить
            </button>
          </form>
        ) : null}

        {facts.length ? (
          <ul className="mt-4 space-y-2">
            {facts.map((fact) => (
              <li className="rounded-xl surface-input px-3 py-3 text-sm" key={fact.id}>
                <p className="font-semibold">{fact.trait}</p>
                <p className="mt-1 text-[var(--foreground)]">{fact.description}</p>
                <p className="mt-1 text-xs text-[var(--muted)]">{fact.author_name}</p>
              </li>
            ))}
          </ul>
        ) : (
          <p className="mt-3 text-sm text-[var(--muted)]">
            Добавьте заметки о партнёре — любимый цвет, еда, музыка и т.д.
          </p>
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
