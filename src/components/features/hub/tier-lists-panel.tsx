"use client";

import { Download, Plus, Search, Send, X } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { EmptyState } from "@/components/ui/empty-state";
import { PhotoSourcePicker } from "@/components/ui/photo-source-picker";
import type { HubTierChallenge, TierMakerSearchResult } from "@/components/features/hub/types";
import { addTierListComment, completeTierChallenge, sendTierChallenge } from "@/lib/hub/extended-actions";
import { formatDateRu } from "@/lib/dates";
import { compressImageFile } from "@/lib/media/compress-image.client";
import { uploadCoupleMediaClient } from "@/lib/media/upload.client";

type TierListsPanelProps = {
  challenges: HubTierChallenge[];
  coupleId: string;
  userId: string;
  partnerId: string;
  partnerName: string;
};

export function TierListsPanel({
  challenges,
  coupleId,
  userId,
  partnerId,
  partnerName,
}: TierListsPanelProps) {
  const [showSend, setShowSend] = useState(false);
  const [url, setUrl] = useState("");
  const [title, setTitle] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<TierMakerSearchResult[]>([]);
  const [completeId, setCompleteId] = useState<string | null>(null);
  const [detailId, setDetailId] = useState<string | null>(null);
  const [commentDraft, setCommentDraft] = useState("");
  const [error, setError] = useState("");
  const [isPending, startTransition] = useTransition();
  const router = useRouter();

  const inbox = challenges.filter((c) => c.target_user_id === userId && c.status === "pending");
  const done = challenges.filter((c) => c.status === "completed");
  const detailChallenge = done.find((item) => item.id === detailId) ?? null;

  async function searchTierLists(value: string) {
    setSearchQuery(value);
    if (value.trim().length < 2) {
      setSearchResults([]);
      return;
    }

    const response = await fetch(`/api/tiermaker/search?q=${encodeURIComponent(value.trim())}`);
    const payload = (await response.json()) as { results?: TierMakerSearchResult[]; error?: string };
    if (payload.error) {
      setError(payload.error);
    }
    setSearchResults(payload.results ?? []);
  }

  function pickTierList(result: TierMakerSearchResult) {
    setTitle(result.title);
    setUrl(result.url);
    setShowSend(true);
    setSearchResults([]);
    setSearchQuery("");
  }

  function sendChallenge(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    startTransition(async () => {
      const result = await sendTierChallenge(partnerId, url, title);
      if (!result.ok) {
        setError(result.error ?? "Не удалось отправить.");
        return;
      }
      setShowSend(false);
      setUrl("");
      setTitle("");
      router.refresh();
    });
  }

  function submitComment(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!detailChallenge) {
      return;
    }

    const body = commentDraft.trim();
    if (!body) {
      return;
    }

    setError("");
    startTransition(async () => {
      const result = await addTierListComment(detailChallenge.id, body);
      if (!result.ok) {
        setError(result.error ?? "Не удалось отправить комментарий.");
        return;
      }
      setCommentDraft("");
      router.refresh();
    });
  }

  return (
    <>
      <section className="mb-6 rounded-3xl surface-panel p-4">
        <p className="text-sm font-semibold">Поиск тир-листов</p>
        <div className="relative mt-3">
          <Search
            aria-hidden
            className="pointer-events-none absolute left-4 top-1/2 size-4 -translate-y-1/2 text-[var(--muted)]"
          />
          <input
            className="w-full rounded-2xl surface-input py-3 pl-11 pr-4 text-sm"
            onChange={(event) => void searchTierLists(event.target.value)}
            placeholder="Например: anime, marvel, games…"
            value={searchQuery}
          />
        </div>
        {searchResults.length ? (
          <div className="mt-3 grid max-h-48 gap-2 overflow-y-auto">
            {searchResults.map((result) => (
              <button
                className="rounded-xl surface-input px-3 py-2 text-left text-sm font-medium"
                key={result.url}
                onClick={() => pickTierList(result)}
                type="button"
              >
                {result.title}
              </button>
            ))}
          </div>
        ) : null}
        <p className="mt-3 text-xs leading-5 text-[var(--muted)]">
          Или найдите на{" "}
          <a className="font-semibold text-[var(--accent)]" href="https://tiermaker.com" rel="noreferrer" target="_blank">
            tiermaker.com
          </a>{" "}
          и вставьте ссылку вручную.
        </p>
      </section>

      {inbox.length ? (
        <section className="mb-6">
          <p className="mb-2 font-semibold">Входящие</p>
          <div className="grid gap-3">
            {inbox.map((item) => (
              <article className="rounded-3xl surface-panel p-4" key={item.id}>
                <p className="font-bold">{item.tier_list_title}</p>
                <p className="mt-1 text-sm text-[var(--muted)]">От {item.challenger_name}</p>
                <Link
                  className="mt-2 inline-block text-sm font-semibold text-[var(--accent)]"
                  href={item.tier_list_url}
                  rel="noreferrer"
                  target="_blank"
                >
                  Открыть тир-лист
                </Link>
                <button
                  className="mt-3 rounded-xl bg-[var(--accent)] px-3 py-2.5 text-xs font-semibold text-white"
                  onClick={() => setCompleteId(item.id)}
                  type="button"
                >
                  Прикрепить результат
                </button>
              </article>
            ))}
          </div>
        </section>
      ) : (
        <EmptyState description="Пока нет входящих вызовов." title="Входящие пусты" />
      )}

      {done.length ? (
        <section className="mt-6">
          <p className="mb-2 font-semibold">Пройденные</p>
          <div className="grid gap-2">
            {done.map((item) => (
              <button
                className="flex w-full items-center gap-3 rounded-2xl surface-panel px-4 py-3 text-left active:scale-[0.99]"
                key={item.id}
                onClick={() => setDetailId(item.id)}
                type="button"
              >
                <span className="h-8 w-1 shrink-0 rounded-full bg-[var(--accent)]" />
                <span className="min-w-0 flex-1 truncate font-semibold">{item.tier_list_title}</span>
                <span className="shrink-0 text-xs text-[var(--muted)]">{item.challenger_name}</span>
              </button>
            ))}
          </div>
        </section>
      ) : null}

      <button
        aria-label="Отправить вызов"
        className="fixed bottom-[calc(max(0.75rem,env(safe-area-inset-bottom))+5.25rem)] right-5 z-30 grid size-14 place-items-center rounded-full bg-[var(--accent)] text-white shadow-lg active:scale-95"
        onClick={() => setShowSend(true)}
        type="button"
      >
        <Plus aria-hidden className="size-7" />
      </button>

      {showSend ? (
        <div className="fixed inset-0 z-50 flex items-end bg-black/40 p-4 pb-24">
          <form className="w-full rounded-3xl surface-panel p-5" onSubmit={sendChallenge}>
            <div className="mb-3 flex items-center justify-between">
              <p className="text-lg font-bold">Вызов для {partnerName}</p>
              <button
                aria-label="Закрыть"
                className="grid size-9 place-items-center rounded-full surface-input"
                onClick={() => setShowSend(false)}
                type="button"
              >
                <X aria-hidden className="size-5" />
              </button>
            </div>
            <div className="grid gap-3">
              <input
                className="rounded-2xl surface-input px-4 py-3"
                onChange={(event) => setTitle(event.target.value)}
                placeholder="Название тир-листа"
                required
                value={title}
              />
              <input
                className="rounded-2xl surface-input px-4 py-3"
                onChange={(event) => setUrl(event.target.value)}
                placeholder="Ссылка TierMaker"
                required
                type="url"
                value={url}
              />
              {error ? <p className="alert-error rounded-xl px-3 py-2 text-sm">{error}</p> : null}
              <button
                className="rounded-2xl bg-[var(--accent)] py-3 font-semibold text-white disabled:opacity-60"
                disabled={isPending}
                type="submit"
              >
                Отправить
              </button>
            </div>
          </form>
        </div>
      ) : null}

      {completeId ? (
        <div className="fixed inset-0 z-50 flex items-end bg-black/40 p-4 pb-24">
          <div className="w-full rounded-3xl surface-panel p-5">
            <p className="font-bold">Скриншот результата</p>
            {error ? <p className="mt-2 alert-error rounded-xl px-3 py-2 text-sm">{error}</p> : null}
            <PhotoSourcePicker
              onSelect={(file) =>
                startTransition(async () => {
                  const prepared = await compressImageFile(file);
                  const uploaded = await uploadCoupleMediaClient(coupleId, userId, prepared);
                  if (!uploaded.ok) {
                    setError(uploaded.error);
                    return;
                  }
                  const formData = new FormData();
                  formData.set("mediaPath", uploaded.path);
                  const result = await completeTierChallenge(completeId, formData);
                  if (!result.ok) {
                    setError(result.error ?? "Ошибка");
                    return;
                  }
                  setCompleteId(null);
                  setError("");
                  router.refresh();
                })
              }
              renderTrigger={({ open }) => (
                <button className="mt-3 w-full rounded-2xl surface-input py-3" onClick={open} type="button">
                  Выбрать фото
                </button>
              )}
            />
          </div>
        </div>
      ) : null}

      {detailChallenge ? (
        <div className="fixed inset-0 z-50 flex items-end bg-black/40 p-4 pb-24">
          <div className="max-h-[90vh] w-full overflow-y-auto rounded-3xl surface-panel p-5">
            <div className="mb-4 flex items-center justify-between gap-3">
              <p className="text-lg font-bold">{detailChallenge.tier_list_title}</p>
              <button
                aria-label="Закрыть"
                className="grid size-9 shrink-0 place-items-center rounded-full surface-input"
                onClick={() => {
                  setDetailId(null);
                  setCommentDraft("");
                  setError("");
                }}
                type="button"
              >
                <X aria-hidden className="size-5" />
              </button>
            </div>

            <Link
              className="inline-flex text-sm font-semibold text-[var(--accent)]"
              href={detailChallenge.tier_list_url}
              rel="noreferrer"
              target="_blank"
            >
              Открыть на TierMaker
            </Link>

            {detailChallenge.result_image_url ? (
              <div className="mt-4">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  alt=""
                  className="w-full rounded-2xl object-contain"
                  src={detailChallenge.result_image_url}
                />
                <a
                  className="mt-3 inline-flex min-h-11 items-center gap-2 rounded-2xl surface-input px-4 py-2.5 text-sm font-semibold"
                  download={`tier-list-${detailChallenge.id}.jpg`}
                  href={detailChallenge.result_image_url}
                >
                  <Download aria-hidden className="size-4" />
                  Сохранить изображение
                </a>
              </div>
            ) : null}

            <section className="mt-6">
              <p className="mb-2 font-semibold">Комментарии</p>
              {detailChallenge.comments.length ? (
                <ul className="grid gap-2">
                  {detailChallenge.comments.map((comment) => (
                    <li className="rounded-2xl surface-input px-3 py-2.5 text-sm" key={comment.id}>
                      <p className="font-semibold">{comment.author_name}</p>
                      <p className="mt-1">{comment.body}</p>
                      <p className="mt-1 text-xs text-[var(--muted)]">{formatDateRu(comment.created_at)}</p>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-sm text-[var(--muted)]">Пока нет комментариев.</p>
              )}

              <form className="mt-3 flex gap-2" onSubmit={submitComment}>
                <input
                  className="min-h-11 flex-1 rounded-2xl surface-input px-4 py-2.5 text-sm"
                  onChange={(event) => setCommentDraft(event.target.value)}
                  placeholder="Написать комментарий…"
                  value={commentDraft}
                />
                <button
                  aria-label="Отправить"
                  className="grid size-11 shrink-0 place-items-center rounded-2xl bg-[var(--accent)] text-white disabled:opacity-60"
                  disabled={!commentDraft.trim() || isPending}
                  type="submit"
                >
                  <Send aria-hidden className="size-4" />
                </button>
              </form>
              {error ? <p className="mt-2 alert-error rounded-xl px-3 py-2 text-sm">{error}</p> : null}
            </section>
          </div>
        </div>
      ) : null}
    </>
  );
}
