"use client";

import Link from "next/link";
import { Plus } from "lucide-react";
import { useState, useTransition } from "react";
import { ArrowLeft } from "lucide-react";
import { addPartnerNickname, setNotificationsEnabled } from "@/lib/partner/actions";
import { addGalleryPhoto, addPartnerFact } from "@/lib/hub/extended-actions";
import { UserAvatar } from "@/components/ui/user-avatar";
import { PhotoSourcePicker } from "@/components/ui/photo-source-picker";
import { formatDateRu } from "@/lib/dates";
import { compressImageFile } from "@/lib/media/compress-image.client";
import { uploadCoupleMediaClient } from "@/lib/media/upload.client";

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

type GalleryItem = {
  id: string;
  media_url: string;
  caption: string | null;
  author_name: string;
  created_at: string;
};

type PartnerProfileScreenProps = {
  partnerName: string;
  partnerAvatarUrl?: string | null;
  partnerId: string;
  coupleId: string;
  userId: string;
  relationshipStartedOn: string | null;
  daysTogether: number | null;
  nicknames: NicknameRow[];
  notificationsEnabled: boolean;
  facts: PartnerFact[];
  gallery: GalleryItem[];
};

export function PartnerProfileScreen({
  partnerName,
  partnerAvatarUrl,
  partnerId,
  coupleId,
  userId,
  relationshipStartedOn,
  daysTogether,
  nicknames,
  notificationsEnabled,
  facts,
  gallery,
}: PartnerProfileScreenProps) {
  const [nickname, setNickname] = useState("");
  const [notifications, setNotifications] = useState(notificationsEnabled);
  const [showFactForm, setShowFactForm] = useState(false);
  const [trait, setTrait] = useState("");
  const [description, setDescription] = useState("");
  const [showGalleryForm, setShowGalleryForm] = useState(false);
  const [galleryCaption, setGalleryCaption] = useState("");
  const [galleryFile, setGalleryFile] = useState<File | null>(null);
  const [galleryPreview, setGalleryPreview] = useState<string | null>(null);
  const [error, setError] = useState("");
  const [isPreparingPhoto, setIsPreparingPhoto] = useState(false);
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

  async function handleGalleryFilePick(file: File) {
    setError("");
    setIsPreparingPhoto(true);

    try {
      const prepared = await compressImageFile(file);
      if (galleryPreview) {
        URL.revokeObjectURL(galleryPreview);
      }
      setGalleryFile(prepared);
      setGalleryPreview(URL.createObjectURL(prepared));
    } catch {
      setError("Не удалось обработать фото.");
    } finally {
      setIsPreparingPhoto(false);
    }
  }

  function resetGalleryForm() {
    setShowGalleryForm(false);
    setGalleryCaption("");
    setGalleryFile(null);
    if (galleryPreview) {
      URL.revokeObjectURL(galleryPreview);
    }
    setGalleryPreview(null);
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
        <div className="flex items-center justify-between gap-3">
          <div>
            <p className="font-semibold">Общая галерея</p>
            <p className="mt-1 text-sm text-[var(--muted)]">Маленькая лента для двоих</p>
          </div>
          <button
            aria-label="Добавить фото"
            className="grid size-10 place-items-center rounded-full bg-[var(--accent-soft)] text-[var(--accent)]"
            onClick={() => setShowGalleryForm((current) => !current)}
            type="button"
          >
            <Plus aria-hidden className="size-5" />
          </button>
        </div>

        {showGalleryForm ? (
          <form
            className="mt-3 grid gap-2"
            onSubmit={(event) => {
              event.preventDefault();
              if (!galleryFile) {
                setError("Выберите фото.");
                return;
              }

              setError("");
              startTransition(async () => {
                const uploaded = await uploadCoupleMediaClient(coupleId, userId, galleryFile);
                if (!uploaded.ok) {
                  setError(uploaded.error ?? "Не удалось загрузить фото.");
                  return;
                }

                const formData = new FormData();
                formData.set("mediaPath", uploaded.path);
                if (galleryCaption.trim()) {
                  formData.set("caption", galleryCaption.trim());
                }

                const result = await addGalleryPhoto(formData);
                if (!result.ok) {
                  setError(result.error ?? "Не удалось добавить.");
                  return;
                }

                resetGalleryForm();
              });
            }}
          >
            <PhotoSourcePicker
              disabled={isPreparingPhoto || isPending}
              onSelect={(file) => void handleGalleryFilePick(file)}
              renderTrigger={({ open, disabled: pickerDisabled }) => (
                <button
                  className="rounded-2xl surface-input px-4 py-3 text-left text-sm font-semibold disabled:opacity-60"
                  disabled={pickerDisabled}
                  onClick={open}
                  type="button"
                >
                  {galleryPreview ? "Заменить фото" : "Выбрать фото"}
                </button>
              )}
            />
            {galleryPreview ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img alt="" className="max-h-40 w-full rounded-2xl object-cover" src={galleryPreview} />
            ) : null}
            <input
              className="rounded-2xl surface-input px-4 py-3"
              onChange={(event) => setGalleryCaption(event.target.value)}
              placeholder="Подпись (необязательно)"
              value={galleryCaption}
            />
            <div className="flex gap-2">
              <button
                className="flex-1 rounded-2xl surface-input py-3 font-semibold"
                onClick={resetGalleryForm}
                type="button"
              >
                Отмена
              </button>
              <button
                className="flex-1 rounded-2xl bg-[var(--accent)] py-3 font-semibold text-white disabled:opacity-60"
                disabled={isPending || !galleryFile}
                type="submit"
              >
                Добавить
              </button>
            </div>
          </form>
        ) : null}

        {gallery.length ? (
          <div className="mt-4 grid grid-cols-3 gap-2">
            {gallery.map((item) => (
              <figure className="overflow-hidden rounded-2xl" key={item.id}>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img alt={item.caption ?? ""} className="aspect-square w-full object-cover" src={item.media_url} />
              </figure>
            ))}
          </div>
        ) : (
          <p className="mt-3 text-sm text-[var(--muted)]">Пока нет фото — добавьте первое вместе.</p>
        )}
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
