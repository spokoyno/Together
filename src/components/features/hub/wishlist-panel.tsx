"use client";

import { Gift, Plus } from "lucide-react";
import { useState, useTransition } from "react";
import { useLanguage } from "@/components/providers/language-provider";
import { EmptyState } from "@/components/ui/empty-state";
import { ConfirmDeleteButton } from "@/components/ui/confirm-delete-button";
import { ModalSheet } from "@/components/ui/modal-sheet";
import { PhotoSourcePicker } from "@/components/ui/photo-source-picker";
import type { HubWishlistItem } from "@/components/features/hub/types";
import {
  addWishlistItem,
  deleteWishlistItem,
  fulfillWishlistItem,
  wishlistToSurprisePlan,
} from "@/lib/hub/extended-actions";
import { uploadCoupleMediaClient } from "@/lib/media/upload.client";
import { compressImageFile } from "@/lib/media/compress-image.client";

type WishlistPanelProps = {
  items: HubWishlistItem[];
  coupleId: string;
  userId: string;
  partnerName: string;
};

export function WishlistPanel({ items, coupleId, userId, partnerName }: WishlistPanelProps) {
  const [showCreate, setShowCreate] = useState(false);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [mediaFile, setMediaFile] = useState<File | null>(null);
  const [planItemId, setPlanItemId] = useState<string | null>(null);
  const [planDate, setPlanDate] = useState("");
  const [error, setError] = useState("");
  const [isPending, startTransition] = useTransition();
  const { t } = useLanguage();

  const openItems = items.filter((item) => item.status === "open");
  const fulfilledItems = items.filter((item) => item.status === "fulfilled");

  function submitWish(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    startTransition(async () => {
      const formData = new FormData();
      formData.set("title", title);
      formData.set("description", description);
      if (mediaFile) {
        const uploaded = await uploadCoupleMediaClient(coupleId, userId, mediaFile);
        if (!uploaded.ok) {
          setError(uploaded.error);
          return;
        }
        formData.set("mediaPath", uploaded.path);
      }
      const result = await addWishlistItem(formData);
      if (!result.ok) {
        setError(result.error ?? t("hubErrorAdd"));
        return;
      }
      setShowCreate(false);
      setTitle("");
      setDescription("");
      setMediaFile(null);
    });
  }

  return (
    <>
      <section className="grid gap-3">
        {openItems.length ? (
          openItems.map((item) => (
            <article className="overflow-hidden rounded-3xl surface-panel" key={item.id}>
              {item.media_url ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img alt="" className="aspect-video w-full object-cover" src={item.media_url} />
              ) : null}
              <div className="p-4">
                <div className="flex items-start justify-between gap-2">
                  <p className="text-lg font-bold">{item.title}</p>
                  <ConfirmDeleteButton
                    disabled={isPending}
                    onConfirm={() =>
                      startTransition(async () => {
                        await deleteWishlistItem(item.id);
                      })
                    }
                  />
                </div>
                {item.description ? (
                  <p className="mt-1 text-sm text-[var(--muted)]">{item.description}</p>
                ) : null}
                <p className="mt-2 text-xs text-[var(--muted)]">{item.author_name}</p>
                <div className="mt-3 flex flex-wrap gap-2">
                  <button
                    className="rounded-xl bg-[var(--accent-soft)] px-3 py-2 text-xs font-semibold text-[var(--accent)]"
                    disabled={isPending}
                    onClick={() =>
                      startTransition(async () => {
                        await fulfillWishlistItem(item.id);
                      })
                    }
                    type="button"
                  >
                    {t("hubWishlistFulfill")}
                  </button>
                  {item.created_by !== userId ? (
                    <button
                      className="inline-flex items-center gap-1 rounded-xl surface-input px-3 py-2 text-xs font-semibold"
                      onClick={() => setPlanItemId(item.id)}
                      type="button"
                    >
                      <Gift aria-hidden className="size-3.5" /> {t("hubWishlistSurprise")}
                    </button>
                  ) : null}
                </div>
              </div>
            </article>
          ))
        ) : (
          <EmptyState description={t("hubWishlistEmptyDesc")} title={t("hubWishlistEmpty")} />
        )}
      </section>

      {fulfilledItems.length ? (
        <section className="mt-6">
          <p className="mb-3 text-sm font-semibold text-[var(--muted)]">{t("hubFulfilledTab")}</p>
          <div className="grid gap-2">
            {fulfilledItems.map((item) => (
              <div className="flex items-center justify-between gap-2 rounded-2xl surface-input px-3 py-2 text-sm" key={item.id}>
                <span>
                  ✓ {item.title}
                  {item.fulfilled_by_name ? ` · ${item.fulfilled_by_name}` : ""}
                </span>
                <ConfirmDeleteButton
                  disabled={isPending}
                  onConfirm={() =>
                    startTransition(async () => {
                      await deleteWishlistItem(item.id);
                    })
                  }
                />
              </div>
            ))}
          </div>
        </section>
      ) : null}

      <button
        aria-label={t("hubWishlistAdd")}
        className="fixed bottom-[calc(max(0.75rem,env(safe-area-inset-bottom))+5.25rem)] right-5 z-30 grid size-14 place-items-center rounded-full bg-[var(--accent)] text-white shadow-lg"
        onClick={() => setShowCreate(true)}
        type="button"
      >
        <Plus aria-hidden className="size-7" />
      </button>

      {showCreate ? (
        <ModalSheet as="form" onClose={() => setShowCreate(false)} onSubmit={submitWish} open>
            <p className="text-lg font-bold">{t("hubWishlistNew")}</p>
            <div className="mt-3 grid gap-3">
              <input
                className="rounded-2xl surface-input px-4 py-3"
                onChange={(e) => setTitle(e.target.value)}
                placeholder={t("hubWishlistTitlePlaceholder")}
                required
                value={title}
              />
              <textarea
                className="min-h-20 rounded-2xl surface-input px-4 py-3"
                onChange={(e) => setDescription(e.target.value)}
                placeholder={t("hubWishlistDetailsPlaceholder")}
                value={description}
              />
              <PhotoSourcePicker
                onSelect={(file) => void compressImageFile(file).then(setMediaFile)}
                renderTrigger={({ open }) => (
                  <button className="rounded-2xl surface-input px-4 py-3 text-left text-sm" onClick={open} type="button">
                    {t("commonPhotoOptional")}
                  </button>
                )}
              />
              {error ? <p className="alert-error rounded-xl px-3 py-2 text-sm">{error}</p> : null}
              <button className="rounded-2xl bg-[var(--accent)] py-3 font-semibold text-white" disabled={isPending} type="submit">
                {t("commonAdd")}
              </button>
            </div>
        </ModalSheet>
      ) : null}

      {planItemId ? (
        <ModalSheet onClose={() => setPlanItemId(null)} open>
            <p className="font-bold">{t("hubWishlistSurpriseFor", { name: partnerName })}</p>
            <input
              className="mt-3 w-full rounded-2xl surface-input px-4 py-3"
              onChange={(e) => setPlanDate(e.target.value)}
              type="date"
              value={planDate}
            />
            <button
              className="mt-3 w-full rounded-2xl bg-[var(--accent)] py-3 font-semibold text-white"
              disabled={!planDate || isPending}
              onClick={() =>
                startTransition(async () => {
                  const result = await wishlistToSurprisePlan(planItemId, `${planDate}T12:00`);
                  if (!result.ok) {
                    setError(result.error ?? t("commonErrorGeneric"));
                    return;
                  }
                  setPlanItemId(null);
                  setPlanDate("");
                })
              }
              type="button"
            >
              {t("hubWishlistScheduleSurprise")}
            </button>
        </ModalSheet>
      ) : null}
    </>
  );
}
