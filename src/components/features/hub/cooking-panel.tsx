"use client";

import { Check, Plus } from "lucide-react";
import { useMemo, useState, useTransition } from "react";
import { EmptyState } from "@/components/ui/empty-state";
import { PhotoSourcePicker } from "@/components/ui/photo-source-picker";
import type { HubCookingDish } from "@/components/features/hub/types";
import { addCookingDish, addCookingLog, markDishCooked } from "@/lib/hub/actions";
import { formatDateRu } from "@/lib/dates";
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
      setError("Не удалось обработать фото.");
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
      setError("Не удалось обработать фото.");
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
        setError(result.error ?? "Не удалось добавить блюдо.");
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
      setError("Не удалось обработать фото.");
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
        setError(result.error ?? "Не удалось добавить комментарий.");
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
        setError(result.error ?? "Не удалось отметить блюдо.");
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
          Хотим приготовить
        </button>
        <button
          className={`flex-1 rounded-2xl px-4 py-2.5 text-sm font-semibold ${
            view === "cooked" ? "bg-[var(--accent)] text-white" : "surface-input"
          }`}
          onClick={() => setView("cooked")}
          type="button"
        >
          Уже готовили
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
                        ? `Готовили ${formatDateRu(dish.cooked_at.slice(0, 10))}`
                        : `Добавил(а) ${dish.author_name}`}
                    </p>
                  </div>
                  {dish.status === "planned" ? (
                    <button
                      className="inline-flex items-center gap-1 rounded-2xl bg-[var(--accent-soft)] px-3 py-2 text-sm font-semibold text-[var(--accent)]"
                      onClick={() => setCookingDishId(dish.id)}
                      type="button"
                    >
                      <Check aria-hidden className="size-4" />
                      Готовили
                    </button>
                  ) : (
                    <button
                      className="rounded-2xl surface-input px-3 py-2 text-sm font-semibold"
                      onClick={() => setCommentDishId(dish.id)}
                      type="button"
                    >
                      Комментарий
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
                          {log.author_name} · {formatDateRu(log.created_at.slice(0, 10))}
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
              view === "planned"
                ? "Добавьте блюдо с фото и рецептом."
                : "Отметьте блюдо как приготовленное — оно появится здесь."
            }
            title={view === "planned" ? "Список пуст" : "Пока ничего не готовили"}
          />
        )}
      </section>

      {view === "planned" ? (
        <button
          aria-label="Добавить блюдо"
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
            <p className="text-lg font-bold">Новое блюдо</p>
            <div className="mt-4 grid gap-3">
              <input
                className="rounded-2xl surface-input px-4 py-3"
                onChange={(event) => setTitle(event.target.value)}
                placeholder="Название"
                required
                value={title}
              />
              <textarea
                className="min-h-24 rounded-2xl surface-input px-4 py-3"
                onChange={(event) => setRecipe(event.target.value)}
                placeholder="Рецепт (необязательно)"
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
                      Фото блюда (необязательно)
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
                  Отмена
                </button>
                <button
                  className="rounded-2xl bg-[var(--accent)] px-4 py-3 font-semibold text-white disabled:opacity-60"
                  disabled={isPending}
                  type="submit"
                >
                  {isPending ? "Сохраняем..." : "Добавить"}
                </button>
              </div>
            </div>
          </form>
        </div>
      ) : null}

      {cookingDishId ? (
        <div className="fixed inset-0 z-50 flex items-end bg-black/40 p-4 pb-[calc(max(0.75rem,env(safe-area-inset-bottom))+5rem)]">
          <div className="max-h-[85vh] w-full overflow-y-auto rounded-3xl surface-panel p-5 shadow-xl">
            <p className="text-lg font-bold">Мы это готовили!</p>
            <p className="mt-1 text-sm text-[var(--muted)]">
              Добавьте комментарий или фото результата
            </p>
            <div className="mt-4 grid gap-3">
              <textarea
                className="min-h-20 rounded-2xl surface-input px-4 py-3"
                onChange={(event) => setCookNote(event.target.value)}
                placeholder="Как прошло? Что получилось?"
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
                      Фото результата
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
                  Отмена
                </button>
                <button
                  className="rounded-2xl bg-[var(--accent)] px-4 py-3 font-semibold text-white disabled:opacity-60"
                  disabled={isPending}
                  onClick={confirmCooked}
                  type="button"
                >
                  {isPending ? "Сохраняем..." : "Сохранить"}
                </button>
              </div>
            </div>
          </div>
        </div>
      ) : null}

      {commentDishId ? (
        <div className="fixed inset-0 z-50 flex items-end bg-black/40 p-4 pb-[calc(max(0.75rem,env(safe-area-inset-bottom))+5rem)]">
          <div className="max-h-[85vh] w-full overflow-y-auto rounded-3xl surface-panel p-5 shadow-xl">
            <p className="text-lg font-bold">Комментарий к блюду</p>
            <div className="mt-4 grid gap-3">
              <textarea
                className="min-h-20 rounded-2xl surface-input px-4 py-3"
                onChange={(event) => setCommentNote(event.target.value)}
                placeholder="Как получилось в этот раз?"
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
                      Прикрепить фото
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
                  Отмена
                </button>
                <button
                  className="rounded-2xl bg-[var(--accent)] px-4 py-3 font-semibold text-white disabled:opacity-60"
                  disabled={isPending}
                  onClick={submitComment}
                  type="button"
                >
                  {isPending ? "Сохраняем..." : "Отправить"}
                </button>
              </div>
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
}
