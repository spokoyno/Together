"use client";

import { Check, Plus } from "lucide-react";
import { useMemo, useState, useTransition } from "react";
import { useLanguage } from "@/components/providers/language-provider";
import { EmptyState } from "@/components/ui/empty-state";
import { PhotoSourcePicker } from "@/components/ui/photo-source-picker";
import type { HubCookingDish } from "@/components/features/hub/types";
import { addCookingDish, addCookingLog, markDishCooked } from "@/lib/hub/actions";
import { formatDateLocalized } from "@/lib/dates";
import { compressImageFile } from "@/lib/media/compress-image.client";
import { uploadCoupleMediaClient } from "@/lib/media/upload.client";

type CookingPanelProps = {
  dishes: HubCookingDish[];
  userId: string;
  coupleId: string;
};

type CookingView = "planned" | "cooked";

export function CookingPanel({ dishes, userId, coupleId }: CookingPanelProps) {
  const [view, setView] = useState<CookingView>("planned");
  const [showCreate, setShowCreate] = useState(false);
  const [title, setTitle] = useState("");
  const [recipe, setRecipe] = useState("");
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [mediaFile, setMediaFile] = useState<File | null>(null);
  const [cookingDishId, setCookingDishId] = useState<string | null>(null);
  const [cookNote, setCookNote] = useState("");
  const [cookPreviewUrl, setCookPreviewUrl] = useState<string | null>(null);
  const [cookMediaFile, setCookMediaFile] = useState<File | null>(null);
  const [commentDishId, setCommentDishId] = useState<string | null>(null);
  const [commentNote, setCommentNote] = useState("");
  const [commentPreviewUrl, setCommentPreviewUrl] = useState<string | null>(null);
  const [commentMediaFile, setCommentMediaFile] = useState<File | null>(null);
  const [error, setError] = useState("");
  const [isPreparingPhoto, setIsPreparingPhoto] = useState(false);
  const [isPending, startTransition] = useTransition();
  const { locale, t } = useLanguage();

  const planned = useMemo(
    () => dishes.filter((dish) => dish.status === "planned"),
    [dishes],
  );
  const cooked = useMemo(
    () => dishes.filter((dish) => dish.status === "cooked"),
    [dishes],
  );
  const visible = view === "planned" ? planned : cooked;

  async function handleReferencePhoto(file: File) {
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

  async function handleCookPhoto(file: File) {
    setIsPreparingPhoto(true);
    try {
      const prepared = await compressImageFile(file);
      if (cookPreviewUrl) {
        URL.revokeObjectURL(cookPreviewUrl);
      }
      setCookMediaFile(prepared);
      setCookPreviewUrl(URL.createObjectURL(prepared));
    } catch {
      setError(t("hubErrorPhoto"));
    } finally {
      setIsPreparingPhoto(false);
    }
  }

  function submitDish(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");

    startTransition(async () => {
      const formData = new FormData();
      formData.set("title", title);
      formData.set("recipe", recipe);

      if (mediaFile) {
        const uploaded = await uploadCoupleMediaClient(coupleId, userId, mediaFile);
        if (!uploaded.ok) {
          setError(uploaded.error);
          return;
        }
        formData.set("mediaPath", uploaded.path);
      }

      const result = await addCookingDish(formData);
      if (!result.ok) {
        setError(result.error ?? t("hubCookingErrorAddDish"));
        return;
      }

      setShowCreate(false);
      setTitle("");
      setRecipe("");
      if (previewUrl) {
        URL.revokeObjectURL(previewUrl);
      }
      setPreviewUrl(null);
      setMediaFile(null);
    });
  }

  async function handleCommentPhoto(file: File) {
    setIsPreparingPhoto(true);
    try {
      const prepared = await compressImageFile(file);
      if (commentPreviewUrl) {
        URL.revokeObjectURL(commentPreviewUrl);
      }
      setCommentMediaFile(prepared);
      setCommentPreviewUrl(URL.createObjectURL(prepared));
    } catch {
      setError(t("hubErrorPhoto"));
    } finally {
      setIsPreparingPhoto(false);
    }
  }

  function submitComment() {
    if (!commentDishId) {
      return;
    }

    setError("");
    startTransition(async () => {
      const formData = new FormData();
      formData.set("body", commentNote);

      if (commentMediaFile) {
        const uploaded = await uploadCoupleMediaClient(coupleId, userId, commentMediaFile);
        if (!uploaded.ok) {
          setError(uploaded.error);
          return;
        }
        formData.set("mediaPath", uploaded.path);
      }

      const result = await addCookingLog(commentDishId, formData);
      if (!result.ok) {
        setError(result.error ?? t("hubErrorComment"));
        return;
      }

      setCommentDishId(null);
      setCommentNote("");
      if (commentPreviewUrl) {
        URL.revokeObjectURL(commentPreviewUrl);
      }
      setCommentPreviewUrl(null);
      setCommentMediaFile(null);
    });
  }

  function confirmCooked() {
    if (!cookingDishId) {
      return;
    }

    setError("");
    startTransition(async () => {
      const formData = new FormData();
      formData.set("body", cookNote);

      if (cookMediaFile) {
        const uploaded = await uploadCoupleMediaClient(coupleId, userId, cookMediaFile);
        if (!uploaded.ok) {
          setError(uploaded.error);
          return;
        }
        formData.set("mediaPath", uploaded.path);
      }

      const result = await markDishCooked(cookingDishId, formData);
      if (!result.ok) {
        setError(result.error ?? t("hubCookingErrorMark"));
        return;
      }

      setCookingDishId(null);
      setCookNote("");
      if (cookPreviewUrl) {
        URL.revokeObjectURL(cookPreviewUrl);
      }
      setCookPreviewUrl(null);
      setCookMediaFile(null);
      setView("cooked");
    });
  }

  return (
    <>
      <div className="mb-4 flex gap-2">
        <button
          className={`flex-1 rounded-2xl px-4 py-2.5 text-sm font-semibold ${
            view === "planned" ? "bg-[var(--accent)] text-white" : "surface-input"
          }`}
          onClick={() => setView("planned")}
          type="button"
        >
          {t("hubCookingWantCook")}
        </button>
        <button
          className={`flex-1 rounded-2xl px-4 py-2.5 text-sm font-semibold ${
            view === "cooked" ? "bg-[var(--accent)] text-white" : "surface-input"
          }`}
          onClick={() => setView("cooked")}
          type="button"
        >
          {t("hubCookingAlreadyCooked")}
        </button>
      </div>

      <section className="grid gap-4">
        {visible.length ? (
          visible.map((dish) => (
            <article className="overflow-hidden rounded-3xl surface-panel" key={dish.id}>
              {dish.media_url ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img alt="" className="aspect-video w-full object-cover" src={dish.media_url} />
              ) : null}
              <div className="p-4">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <h2 className="text-lg font-bold">{dish.title}</h2>
                    {dish.recipe ? (
                      <p className="mt-2 whitespace-pre-wrap text-sm leading-6 text-[var(--muted)]">
                        {dish.recipe}
                      </p>
                    ) : null}
                    <p className="mt-2 text-xs text-[var(--muted)]">
                      {dish.status === "cooked" && dish.cooked_at
                        ? t("hubCookedOn", {
                            date: formatDateLocalized(locale, dish.cooked_at.slice(0, 10)),
                          })
                        : t("hubAddedBy", { name: dish.author_name })}
                    </p>
                  </div>
                  {dish.status === "planned" ? (
                    <button
                      className="inline-flex items-center gap-1 rounded-2xl bg-[var(--accent-soft)] px-3 py-2 text-sm font-semibold text-[var(--accent)]"
                      onClick={() => setCookingDishId(dish.id)}
                      type="button"
                    >
                      <Check aria-hidden className="size-4" />
                      {t("hubCookingMarkCooked")}
                    </button>
                  ) : (
                    <button
                      className="rounded-2xl surface-input px-3 py-2 text-sm font-semibold"
                      onClick={() => setCommentDishId(dish.id)}
                      type="button"
                    >
                      {t("hubCookingComment")}
                    </button>
                  )}
                </div>

                {dish.logs.length ? (
                  <div className="mt-4 space-y-3 border-t border-[var(--border)] pt-4">
                    {dish.logs.map((log) => (
                      <div className="rounded-2xl bg-[var(--input-bg)] p-3" key={log.id}>
                        {log.media_url ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img
                            alt=""
                            className="mb-2 aspect-video w-full rounded-xl object-cover"
                            src={log.media_url}
                          />
                        ) : null}
                        {log.body ? <p className="text-sm">{log.body}</p> : null}
                        <p className="mt-1 text-xs text-[var(--muted)]">
                          {log.author_name} · {formatDateLocalized(locale, log.created_at.slice(0, 10))}
                        </p>
                      </div>
                    ))}
                  </div>
                ) : null}
              </div>
            </article>
          ))
        ) : (
          <EmptyState
            description={
              view === "planned" ? t("hubCookingEmptyPlanned") : t("hubCookingEmptyCooked")
            }
            title={
              view === "planned" ? t("hubCookingEmptyPlannedTitle") : t("hubCookingEmptyCookedTitle")
            }
          />
        )}
      </section>

      {view === "planned" ? (
        <button
          aria-label={t("hubCookingAddDish")}
          className="fixed bottom-[calc(max(0.75rem,env(safe-area-inset-bottom))+5.25rem)] right-5 z-30 grid size-14 place-items-center rounded-full bg-[var(--accent)] text-white shadow-lg active:scale-95"
          onClick={() => setShowCreate(true)}
          type="button"
        >
          <Plus aria-hidden className="size-7" strokeWidth={2.2} />
        </button>
      ) : null}

      {showCreate ? (
        <div className="fixed inset-0 z-50 flex items-end bg-black/40 p-4 pb-[calc(max(0.75rem,env(safe-area-inset-bottom))+5rem)]">
          <form
            className="max-h-[85vh] w-full overflow-y-auto rounded-3xl surface-panel p-5 shadow-xl"
            onSubmit={submitDish}
          >
            <p className="text-lg font-bold">{t("hubCookingNewDish")}</p>
            <div className="mt-4 grid gap-3">
              <input
                className="rounded-2xl surface-input px-4 py-3"
                onChange={(event) => setTitle(event.target.value)}
                placeholder={t("commonTitle")}
                required
                value={title}
              />
              <textarea
                className="min-h-24 rounded-2xl surface-input px-4 py-3"
                onChange={(event) => setRecipe(event.target.value)}
                placeholder={t("hubCookingRecipePlaceholder")}
                value={recipe}
              />
              {previewUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img alt="" className="aspect-video w-full rounded-2xl object-cover" src={previewUrl} />
              ) : (
                <PhotoSourcePicker
                  disabled={isPreparingPhoto || isPending}
                  onSelect={(file) => void handleReferencePhoto(file)}
                  renderTrigger={({ open, disabled }) => (
                    <button
                      className="rounded-2xl surface-input px-4 py-3 text-left text-sm font-semibold disabled:opacity-60"
                      disabled={disabled}
                      onClick={open}
                      type="button"
                    >
                      {t("hubCookingDishPhotoOptional")}
                    </button>
                  )}
                />
              )}
              {error ? <p className="alert-error rounded-xl px-3 py-2 text-sm">{error}</p> : null}
              <div className="grid grid-cols-2 gap-2">
                <button
                  className="rounded-2xl surface-input px-4 py-3 font-semibold"
                  onClick={() => setShowCreate(false)}
                  type="button"
                >
                  {t("commonCancel")}
                </button>
                <button
                  className="rounded-2xl bg-[var(--accent)] px-4 py-3 font-semibold text-white disabled:opacity-60"
                  disabled={isPending}
                  type="submit"
                >
                  {isPending ? t("commonSaving") : t("commonAdd")}
                </button>
              </div>
            </div>
          </form>
        </div>
      ) : null}

      {cookingDishId ? (
        <div className="fixed inset-0 z-50 flex items-end bg-black/40 p-4 pb-[calc(max(0.75rem,env(safe-area-inset-bottom))+5rem)]">
          <div className="max-h-[85vh] w-full overflow-y-auto rounded-3xl surface-panel p-5 shadow-xl">
            <p className="text-lg font-bold">{t("hubCookingWeCooked")}</p>
            <p className="mt-1 text-sm text-[var(--muted)]">{t("hubCookingAddCommentOrPhoto")}</p>
            <div className="mt-4 grid gap-3">
              <textarea
                className="min-h-20 rounded-2xl surface-input px-4 py-3"
                onChange={(event) => setCookNote(event.target.value)}
                placeholder={t("hubCookingHowWasIt")}
                value={cookNote}
              />
              {cookPreviewUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  alt=""
                  className="aspect-video w-full rounded-2xl object-cover"
                  src={cookPreviewUrl}
                />
              ) : (
                <PhotoSourcePicker
                  disabled={isPreparingPhoto || isPending}
                  onSelect={(file) => void handleCookPhoto(file)}
                  renderTrigger={({ open, disabled }) => (
                    <button
                      className="rounded-2xl surface-input px-4 py-3 text-left text-sm font-semibold disabled:opacity-60"
                      disabled={disabled}
                      onClick={open}
                      type="button"
                    >
                      {t("hubCookingResultPhoto")}
                    </button>
                  )}
                />
              )}
              {error ? <p className="alert-error rounded-xl px-3 py-2 text-sm">{error}</p> : null}
              <div className="grid grid-cols-2 gap-2">
                <button
                  className="rounded-2xl surface-input px-4 py-3 font-semibold"
                  onClick={() => setCookingDishId(null)}
                  type="button"
                >
                  {t("commonCancel")}
                </button>
                <button
                  className="rounded-2xl bg-[var(--accent)] px-4 py-3 font-semibold text-white disabled:opacity-60"
                  disabled={isPending}
                  onClick={confirmCooked}
                  type="button"
                >
                  {isPending ? t("commonSaving") : t("commonSave")}
                </button>
              </div>
            </div>
          </div>
        </div>
      ) : null}

      {commentDishId ? (
        <div className="fixed inset-0 z-50 flex items-end bg-black/40 p-4 pb-[calc(max(0.75rem,env(safe-area-inset-bottom))+5rem)]">
          <div className="max-h-[85vh] w-full overflow-y-auto rounded-3xl surface-panel p-5 shadow-xl">
            <p className="text-lg font-bold">{t("hubCookingDishComment")}</p>
            <div className="mt-4 grid gap-3">
              <textarea
                className="min-h-20 rounded-2xl surface-input px-4 py-3"
                onChange={(event) => setCommentNote(event.target.value)}
                placeholder={t("hubCookingHowThisTime")}
                value={commentNote}
              />
              {commentPreviewUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  alt=""
                  className="aspect-video w-full rounded-2xl object-cover"
                  src={commentPreviewUrl}
                />
              ) : (
                <PhotoSourcePicker
                  disabled={isPreparingPhoto || isPending}
                  onSelect={(file) => void handleCommentPhoto(file)}
                  renderTrigger={({ open, disabled }) => (
                    <button
                      className="rounded-2xl surface-input px-4 py-3 text-left text-sm font-semibold disabled:opacity-60"
                      disabled={disabled}
                      onClick={open}
                      type="button"
                    >
                      {t("hubCookingAttachPhoto")}
                    </button>
                  )}
                />
              )}
              {error ? <p className="alert-error rounded-xl px-3 py-2 text-sm">{error}</p> : null}
              <div className="grid grid-cols-2 gap-2">
                <button
                  className="rounded-2xl surface-input px-4 py-3 font-semibold"
                  onClick={() => setCommentDishId(null)}
                  type="button"
                >
                  {t("commonCancel")}
                </button>
                <button
                  className="rounded-2xl bg-[var(--accent)] px-4 py-3 font-semibold text-white disabled:opacity-60"
                  disabled={isPending}
                  onClick={submitComment}
                  type="button"
                >
                  {isPending ? t("commonSaving") : t("commonSend")}
                </button>
              </div>
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
}
