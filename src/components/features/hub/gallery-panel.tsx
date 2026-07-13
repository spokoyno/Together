"use client";

import { ImagePlus, Loader2, MessageCircle, X } from "lucide-react";
import { useState, useTransition } from "react";
import { EmptyState } from "@/components/ui/empty-state";
import { PhotoSourcePicker } from "@/components/ui/photo-source-picker";
import { formatDateRu } from "@/lib/dates";
import { addGalleryComment, addGalleryPhotos } from "@/lib/gallery/actions";
import { compressImageFile } from "@/lib/media/compress-image.client";
import { uploadCoupleMediaClient } from "@/lib/media/upload.client";
import type { HubGalleryItem } from "@/lib/hub/load-data.server";

type GalleryPanelProps = {
  items: HubGalleryItem[];
  coupleId: string;
  userId: string;
};

export function GalleryPanel({ items, coupleId, userId }: GalleryPanelProps) {
  const [fullscreenUrl, setFullscreenUrl] = useState<string | null>(null);
  const [commentTarget, setCommentTarget] = useState<string | null>(null);
  const [commentDraft, setCommentDraft] = useState("");
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState("");
  const [isPending, startTransition] = useTransition();

  async function handleFiles(files: File[]) {
    if (!files.length) {
      return;
    }

    setError("");
    setIsUploading(true);

    try {
      const paths: string[] = [];
      for (const file of files) {
        const prepared = await compressImageFile(file);
        const result = await uploadCoupleMediaClient(coupleId, userId, prepared);
        if (!result.ok) {
          setError(result.error);
          return;
        }
        paths.push(result.path);
      }

      const saveResult = await addGalleryPhotos(paths);
      if (!saveResult.ok) {
        setError(saveResult.error ?? "Не удалось сохранить.");
      }
    } catch {
      setError("Не удалось загрузить фото.");
    } finally {
      setIsUploading(false);
    }
  }

  function submitComment(galleryId: string) {
    const text = commentDraft.trim();
    if (!text) {
      return;
    }

    startTransition(async () => {
      const result = await addGalleryComment(galleryId, text);
      if (!result.ok) {
        setError(result.error ?? "Не удалось добавить комментарий.");
        return;
      }
      setCommentDraft("");
      setCommentTarget(null);
    });
  }

  return (
    <>
      {items.length ? (
        <section className="columns-2 gap-3 space-y-3">
          {items.map((item) => (
            <article className="break-inside-avoid overflow-hidden rounded-2xl surface-panel" key={item.id}>
              <button
                className="block w-full"
                onClick={() => setFullscreenUrl(item.media_url)}
                type="button"
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img alt="" className="w-full object-cover" src={item.media_url} />
              </button>
              <div className="space-y-2 p-3">
                {item.caption ? (
                  <p className="text-sm">{item.caption}</p>
                ) : null}
                <p className="text-xs text-[var(--muted)]">
                  {item.author_name} · {formatDateRu(item.created_at.slice(0, 10))}
                </p>
                {item.comments.length ? (
                  <div className="space-y-1">
                    {item.comments.map((comment) => (
                      <p className="rounded-xl surface-input px-2 py-1.5 text-xs" key={comment.id}>
                        <span className="font-semibold">{comment.author_name}: </span>
                        {comment.body}
                      </p>
                    ))}
                  </div>
                ) : null}
                {commentTarget === item.id ? (
                  <div className="grid gap-2">
                    <input
                      className="rounded-xl surface-input px-3 py-2 text-sm"
                      onChange={(event) => setCommentDraft(event.target.value)}
                      placeholder="Комментарий..."
                      value={commentDraft}
                    />
                    <button
                      className="rounded-xl bg-[var(--accent)] px-3 py-2 text-xs font-semibold text-white"
                      disabled={isPending}
                      onClick={() => submitComment(item.id)}
                      type="button"
                    >
                      Отправить
                    </button>
                  </div>
                ) : (
                  <button
                    className="inline-flex items-center gap-1 text-xs font-semibold text-[var(--accent)]"
                    onClick={() => {
                      setCommentTarget(item.id);
                      setCommentDraft("");
                    }}
                    type="button"
                  >
                    <MessageCircle aria-hidden className="size-3.5" />
                    Комментировать
                  </button>
                )}
              </div>
            </article>
          ))}
        </section>
      ) : (
        <EmptyState
          description="Загрузите общие фото — они появятся в удобной сетке."
          title="Галерея пуста"
        />
      )}

      {error ? <p className="mt-4 alert-error rounded-xl px-3 py-2 text-sm">{error}</p> : null}

      <PhotoSourcePicker
        accept="image/jpeg,image/png,image/webp,image/gif"
        disabled={isUploading || isPending}
        multiple
        onSelect={() => {}}
        onSelectMany={(files) => void handleFiles(files)}
        renderTrigger={({ open, disabled }) => (
          <button
            aria-label="Добавить фото"
            className="fixed bottom-[calc(max(0.75rem,env(safe-area-inset-bottom))+5.25rem)] right-5 z-30 grid size-14 place-items-center rounded-full bg-[var(--accent)] text-white shadow-lg disabled:opacity-60"
            disabled={disabled}
            onClick={open}
            type="button"
          >
            {isUploading ? (
              <Loader2 aria-hidden className="size-7 animate-spin" />
            ) : (
              <ImagePlus aria-hidden className="size-7" />
            )}
          </button>
        )}
      />

      {fullscreenUrl ? (
        <div className="fixed inset-0 z-50 flex flex-col bg-black">
          <button
            aria-label="Закрыть"
            className="absolute right-4 top-[max(1rem,env(safe-area-inset-top))] z-10 grid size-10 place-items-center rounded-full bg-white/15 text-white"
            onClick={() => setFullscreenUrl(null)}
            type="button"
          >
            <X aria-hidden className="size-6" />
          </button>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img alt="" className="m-auto max-h-full max-w-full object-contain" src={fullscreenUrl} />
        </div>
      ) : null}
    </>
  );
}
