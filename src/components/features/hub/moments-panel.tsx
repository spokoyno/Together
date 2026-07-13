"use client";

import { Plus, Send, Trash2 } from "lucide-react";
import { useState, useTransition } from "react";
import { useLanguage } from "@/components/providers/language-provider";
import { EmptyState } from "@/components/ui/empty-state";
import { PhotoSourcePicker } from "@/components/ui/photo-source-picker";
import type { HubMemory } from "@/components/features/hub/types";
import { addMomentComment } from "@/lib/hub/actions";
import { createMoment, deleteMemory } from "@/lib/memories/actions";
import { formatDateLocalized } from "@/lib/dates";
import { compressImageFile } from "@/lib/media/compress-image.client";
import { uploadCoupleMediaClient } from "@/lib/media/upload.client";

type MomentsPanelProps = {
  memories: HubMemory[];
  userId: string;
  coupleId: string;
};

export function MomentsPanel({ memories, userId, coupleId }: MomentsPanelProps) {
  const [showCreate, setShowCreate] = useState(false);
  const [caption, setCaption] = useState("");
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [mediaFile, setMediaFile] = useState<File | null>(null);
  const [commentDrafts, setCommentDrafts] = useState<Record<string, string>>({});
  const [error, setError] = useState("");
  const [isPreparingPhoto, setIsPreparingPhoto] = useState(false);
  const [isPending, startTransition] = useTransition();
  const { locale, t } = useLanguage();

  async function handleFilePick(file: File) {
    setError("");
    setIsPreparingPhoto(true);

    try {
      const prepared = await compressImageFile(file);
      if (previewUrl) {
        URL.revokeObjectURL(previewUrl);
      }
      setMediaFile(prepared);
      setPreviewUrl(URL.createObjectURL(prepared));
    } catch {
      setError(t("hubErrorPhoto"));
    } finally {
      setIsPreparingPhoto(false);
    }
  }

  function resetCreate() {
    setShowCreate(false);
    setCaption("");
    if (previewUrl) {
      URL.revokeObjectURL(previewUrl);
    }
    setPreviewUrl(null);
    setMediaFile(null);
    setError("");
  }

  function handleCreate(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");

    if (!caption.trim() && !mediaFile) {
      setError(t("hubMomentsErrorPhotoOrDesc"));
      return;
    }

    const formData = new FormData();
    formData.set("momentType", "photo");
    formData.set("body", caption.trim());
    formData.set("happenedOn", new Date().toISOString().slice(0, 10));

    startTransition(async () => {
      if (mediaFile) {
        const uploaded = await uploadCoupleMediaClient(coupleId, userId, mediaFile);
        if (!uploaded.ok) {
          setError(uploaded.error);
          return;
        }
        formData.set("mediaPath", uploaded.path);
      }

      const result = await createMoment(formData);
      if (!result.ok) {
        setError(result.error ?? t("hubMomentsErrorCreate"));
        return;
      }
      resetCreate();
    });
  }

  function submitComment(memoryId: string) {
    const body = commentDrafts[memoryId]?.trim();
    if (!body) {
      return;
    }

    startTransition(async () => {
      const result = await addMomentComment(memoryId, body);
      if (!result.ok) {
        setError(result.error ?? t("hubErrorComment"));
        return;
      }
      setCommentDrafts((current) => ({ ...current, [memoryId]: "" }));
    });
  }

  return (
    <>
      <section className="grid gap-5">
        {memories.length ? (
          memories.map((memory) => (
            <article className="overflow-hidden rounded-3xl surface-panel shadow-sm" key={memory.id}>
              {memory.media_url ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img alt="" className="aspect-square w-full object-cover" src={memory.media_url} />
              ) : (
                <div className="grid aspect-square place-items-center bg-[var(--input-bg)] text-4xl">
                  ✨
                </div>
              )}

              <div className="p-4">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    {memory.body ? (
                      <p className="leading-7">{memory.body}</p>
                    ) : null}
                    <p className="mt-2 text-xs text-[var(--muted)]">
                      {formatDateLocalized(locale, memory.happened_on ?? memory.created_at.slice(0, 10))} ·{" "}
                      {memory.author_name}
                    </p>
                  </div>
                  <form action={deleteMemory.bind(null, memory.id)}>
                    <button
                      aria-label={t("commonDelete")}
                      className="grid size-9 place-items-center rounded-full text-[var(--muted)]"
                      type="submit"
                    >
                      <Trash2 aria-hidden className="size-4" />
                    </button>
                  </form>
                </div>

                {memory.comments.length ? (
                  <div className="mt-4 space-y-2 border-t border-[var(--border)] pt-4">
                    {memory.comments.map((comment) => (
                      <p className="text-sm" key={comment.id}>
                        <span className="font-semibold">{comment.author_name}</span>{" "}
                        {comment.body}
                      </p>
                    ))}
                  </div>
                ) : null}

                <div className="mt-4 flex gap-2">
                  <input
                    className="min-w-0 flex-1 rounded-2xl surface-input px-4 py-2.5 text-sm"
                    onChange={(event) =>
                      setCommentDrafts((current) => ({
                        ...current,
                        [memory.id]: event.target.value,
                      }))
                    }
                    placeholder={t("hubGalleryCommentPlaceholder")}
                    value={commentDrafts[memory.id] ?? ""}
                  />
                  <button
                    aria-label={t("commonSend")}
                    className="grid size-11 shrink-0 place-items-center rounded-2xl bg-[var(--accent)] text-white disabled:opacity-60"
                    disabled={isPending}
                    onClick={() => submitComment(memory.id)}
                    type="button"
                  >
                    <Send aria-hidden className="size-4" />
                  </button>
                </div>
              </div>
            </article>
          ))
        ) : (
          <EmptyState description={t("hubMomentsEmptyDesc")} title={t("hubMomentsEmpty")} />
        )}
      </section>

      <button
        aria-label={t("hubMomentsNew")}
        className="fixed bottom-[calc(max(0.75rem,env(safe-area-inset-bottom))+5.25rem)] right-5 z-30 grid size-14 place-items-center rounded-full bg-[var(--accent)] text-white shadow-lg active:scale-95"
        onClick={() => setShowCreate(true)}
        type="button"
      >
        <Plus aria-hidden className="size-7" strokeWidth={2.2} />
      </button>

      {showCreate ? (
        <div className="fixed inset-0 z-50 flex items-end bg-black/40 p-4 pb-[calc(max(0.75rem,env(safe-area-inset-bottom))+5rem)]">
          <form
            className="max-h-[85vh] w-full overflow-y-auto rounded-3xl surface-panel p-5 shadow-xl"
            onSubmit={handleCreate}
          >
            <p className="text-lg font-bold">{t("hubMomentsNew")}</p>
            <div className="mt-4 grid gap-3">
              {previewUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img alt="" className="aspect-square w-full rounded-2xl object-cover" src={previewUrl} />
              ) : (
                <PhotoSourcePicker
                  disabled={isPreparingPhoto || isPending}
                  onSelect={(file) => void handleFilePick(file)}
                  renderTrigger={({ open, disabled }) => (
                    <button
                      className="rounded-2xl surface-input px-4 py-3 text-left text-sm font-semibold disabled:opacity-60"
                      disabled={disabled}
                      onClick={open}
                      type="button"
                    >
                      {isPreparingPhoto ? t("commonLoading") : t("photoAdd")}
                    </button>
                  )}
                />
              )}
              <textarea
                className="min-h-24 rounded-2xl surface-input px-4 py-3"
                onChange={(event) => setCaption(event.target.value)}
                placeholder={t("hubMomentsDescPlaceholder")}
                value={caption}
              />
              {error ? <p className="alert-error rounded-xl px-3 py-2 text-sm">{error}</p> : null}
              <div className="grid grid-cols-2 gap-2">
                <button
                  className="rounded-2xl surface-input px-4 py-3 font-semibold"
                  onClick={resetCreate}
                  type="button"
                >
                  {t("commonCancel")}
                </button>
                <button
                  className="rounded-2xl bg-[var(--accent)] px-4 py-3 font-semibold text-white disabled:opacity-60"
                  disabled={isPending || isPreparingPhoto}
                  type="submit"
                >
                  {isPending ? t("commonPublishing") : t("hubMomentsPublish")}
                </button>
              </div>
            </div>
          </form>
        </div>
      ) : null}
    </>
  );
}
