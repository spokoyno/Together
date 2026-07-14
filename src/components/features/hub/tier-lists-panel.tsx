"use client";

import { Download, ExternalLink, Link2, Plus, Search, Send, X } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { useLanguage } from "@/components/providers/language-provider";
import { EmptyState } from "@/components/ui/empty-state";
import { PhotoSourcePicker } from "@/components/ui/photo-source-picker";
import type { HubTierChallenge } from "@/components/features/hub/types";
import { addTierListComment, completeTierChallenge, sendTierChallenge } from "@/lib/hub/extended-actions";
import { tierMakerSearchUrl } from "@/lib/hub/tier-utils";
import { formatDateLocalized } from "@/lib/dates";
import { compressImageFile } from "@/lib/media/compress-image.client";
import { uploadCoupleMediaClient } from "@/lib/media/upload.client";

type TierListsPanelProps = {
  challenges: HubTierChallenge[];
  coupleId: string;
  userId: string;
  partnerId: string;
  partnerName: string;
};

type CompleteMode = "screenshot" | "link";

export function TierListsPanel({
  challenges,
  coupleId,
  userId,
  partnerId,
  partnerName,
}: TierListsPanelProps) {
  const [showSend, setShowSend] = useState(false);
  const [pasteUrl, setPasteUrl] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [completeId, setCompleteId] = useState<string | null>(null);
  const [completeMode, setCompleteMode] = useState<CompleteMode>("screenshot");
  const [resultLink, setResultLink] = useState("");
  const [detailId, setDetailId] = useState<string | null>(null);
  const [commentDraft, setCommentDraft] = useState("");
  const [error, setError] = useState("");
  const [isPending, startTransition] = useTransition();
  const router = useRouter();
  const { locale, t } = useLanguage();

  const inbox = challenges.filter((c) => c.target_user_id === userId && c.status === "pending");
  const done = challenges.filter((c) => c.status === "completed");
  const detailChallenge = done.find((item) => item.id === detailId) ?? null;
  const completeChallenge = inbox.find((item) => item.id === completeId) ?? null;

  function openTierMakerSearch() {
    const query = searchQuery.trim();
    if (query.length < 2) {
      return;
    }
    window.open(tierMakerSearchUrl(query), "_blank", "noopener,noreferrer");
  }

  function sendChallenge(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    startTransition(async () => {
      const result = await sendTierChallenge(partnerId, pasteUrl);
      if (!result.ok) {
        setError(result.error ?? t("hubTiersErrorSend"));
        return;
      }
      setShowSend(false);
      setPasteUrl("");
      router.refresh();
    });
  }

  function submitCompleteLink(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!completeId) {
      return;
    }

    setError("");
    startTransition(async () => {
      const formData = new FormData();
      formData.set("resultUrl", resultLink.trim());
      const result = await completeTierChallenge(completeId, formData);
      if (!result.ok) {
        setError(result.error ?? t("commonError"));
        return;
      }
      setCompleteId(null);
      setResultLink("");
      setCompleteMode("screenshot");
      setError("");
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
        setError(result.error ?? t("hubTiersErrorComment"));
        return;
      }
      setCommentDraft("");
      router.refresh();
    });
  }

  return (
    <>
      <section className="mb-6 rounded-3xl surface-panel p-4">
        <p className="text-sm font-semibold">{t("hubTiersSearch")}</p>
        <p className="mt-1 text-xs leading-5 text-[var(--muted)]">{t("hubTiersSearchHint")}</p>

        <div className="relative mt-3">
          <Search
            aria-hidden
            className="pointer-events-none absolute left-4 top-1/2 size-4 -translate-y-1/2 text-[var(--muted)]"
          />
          <input
            className="w-full rounded-2xl surface-input py-3 pl-11 pr-4 text-sm"
            onChange={(event) => setSearchQuery(event.target.value)}
            placeholder={t("hubTiersSearchPlaceholder")}
            value={searchQuery}
          />
        </div>

        <button
          className="mt-3 inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-2xl bg-[var(--accent)] px-4 py-2.5 text-sm font-semibold text-white disabled:opacity-50"
          disabled={searchQuery.trim().length < 2}
          onClick={openTierMakerSearch}
          type="button"
        >
          <ExternalLink aria-hidden className="size-4" />
          {t("hubTiersOpenSearch")}
        </button>

        <ol className="mt-4 grid gap-2 text-xs leading-5 text-[var(--muted)]">
          <li>{t("hubTiersStep1")}</li>
          <li>{t("hubTiersStep2")}</li>
          <li>{t("hubTiersStep3")}</li>
        </ol>

        <button
          className="mt-4 w-full rounded-2xl surface-input py-3 text-sm font-semibold"
          onClick={() => {
            setShowSend(true);
            setError("");
          }}
          type="button"
        >
          {t("hubTiersPasteAndSend")}
        </button>
      </section>

      {inbox.length ? (
        <section className="mb-6">
          <p className="mb-2 font-semibold">{t("hubTiersIncoming")}</p>
          <div className="grid gap-3">
            {inbox.map((item) => (
              <article className="rounded-3xl surface-panel p-4" key={item.id}>
                <p className="font-bold">{item.tier_list_title}</p>
                <p className="mt-1 text-sm text-[var(--muted)]">{t("hubFrom", { name: item.challenger_name })}</p>
                <Link
                  className="mt-2 inline-block text-sm font-semibold text-[var(--accent)]"
                  href={item.tier_list_url}
                  rel="noreferrer"
                  target="_blank"
                >
                  {t("hubTiersOpenTierList")}
                </Link>
                <button
                  className="mt-3 rounded-xl bg-[var(--accent)] px-3 py-2.5 text-xs font-semibold text-white"
                  onClick={() => {
                    setCompleteId(item.id);
                    setCompleteMode("screenshot");
                    setResultLink("");
                    setError("");
                  }}
                  type="button"
                >
                  {t("hubTiersAttachResult")}
                </button>
              </article>
            ))}
          </div>
        </section>
      ) : (
        <EmptyState description={t("hubTiersIncomingEmptyDesc")} title={t("hubTiersIncomingEmpty")} />
      )}

      {done.length ? (
        <section className="mt-6">
          <p className="mb-2 font-semibold">{t("hubTiersCompleted")}</p>
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
        aria-label={t("hubTiersSendChallenge")}
        className="fixed bottom-[calc(max(0.75rem,env(safe-area-inset-bottom))+5.25rem)] right-5 z-30 grid size-14 place-items-center rounded-full bg-[var(--accent)] text-white shadow-lg active:scale-95"
        onClick={() => {
          setShowSend(true);
          setError("");
        }}
        type="button"
      >
        <Plus aria-hidden className="size-7" />
      </button>

      {showSend ? (
        <div className="fixed inset-0 z-50 flex items-end bg-black/40 p-4 pb-24">
          <form className="w-full rounded-3xl surface-panel p-5" onSubmit={sendChallenge}>
            <div className="mb-3 flex items-center justify-between">
              <p className="text-lg font-bold">{t("hubTiersChallengeFor", { name: partnerName })}</p>
              <button
                aria-label={t("commonClose")}
                className="grid size-9 place-items-center rounded-full surface-input"
                onClick={() => setShowSend(false)}
                type="button"
              >
                <X aria-hidden className="size-5" />
              </button>
            </div>
            <p className="mb-3 text-sm text-[var(--muted)]">{t("hubTiersPasteLinkHint")}</p>
            <div className="grid gap-3">
              <input
                className="rounded-2xl surface-input px-4 py-3"
                onChange={(event) => setPasteUrl(event.target.value)}
                placeholder={t("hubTiersLinkPlaceholder")}
                required
                type="url"
                value={pasteUrl}
              />
              {error ? <p className="alert-error rounded-xl px-3 py-2 text-sm">{error}</p> : null}
              <button
                className="rounded-2xl bg-[var(--accent)] py-3 font-semibold text-white disabled:opacity-60"
                disabled={isPending}
                type="submit"
              >
                {t("commonSend")}
              </button>
            </div>
          </form>
        </div>
      ) : null}

      {completeId && completeChallenge ? (
        <div className="fixed inset-0 z-50 flex items-end bg-black/40 p-4 pb-24">
          <div className="w-full rounded-3xl surface-panel p-5">
            <div className="mb-4 flex items-center justify-between gap-3">
              <p className="font-bold">{t("hubTiersAttachResult")}</p>
              <button
                aria-label={t("commonClose")}
                className="grid size-9 shrink-0 place-items-center rounded-full surface-input"
                onClick={() => {
                  setCompleteId(null);
                  setResultLink("");
                  setError("");
                }}
                type="button"
              >
                <X aria-hidden className="size-5" />
              </button>
            </div>

            <div className="mb-4 flex gap-2">
              <button
                className={`flex-1 rounded-2xl px-3 py-2.5 text-sm font-semibold ${completeMode === "screenshot" ? "bg-[var(--accent)] text-white" : "surface-input"}`}
                onClick={() => setCompleteMode("screenshot")}
                type="button"
              >
                {t("hubTiersResultScreenshot")}
              </button>
              <button
                className={`flex-1 rounded-2xl px-3 py-2.5 text-sm font-semibold ${completeMode === "link" ? "bg-[var(--accent)] text-white" : "surface-input"}`}
                onClick={() => setCompleteMode("link")}
                type="button"
              >
                {t("hubTiersResultProfileLink")}
              </button>
            </div>

            {error ? <p className="mb-3 alert-error rounded-xl px-3 py-2 text-sm">{error}</p> : null}

            {completeMode === "screenshot" ? (
              <>
                <p className="text-sm text-[var(--muted)]">{t("hubTiersScreenshotHint")}</p>
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
                        setError(result.error ?? t("commonError"));
                        return;
                      }
                      setCompleteId(null);
                      setError("");
                      router.refresh();
                    })
                  }
                  renderTrigger={({ open }) => (
                    <button className="mt-3 w-full rounded-2xl surface-input py-3" onClick={open} type="button">
                      {t("hubTiersSelectPhoto")}
                    </button>
                  )}
                />
              </>
            ) : (
              <form className="grid gap-3" onSubmit={submitCompleteLink}>
                <p className="text-sm text-[var(--muted)]">{t("hubTiersProfileLinkHint")}</p>
                <input
                  className="rounded-2xl surface-input px-4 py-3"
                  onChange={(event) => setResultLink(event.target.value)}
                  placeholder={t("hubTiersProfileLinkPlaceholder")}
                  required
                  type="url"
                  value={resultLink}
                />
                <button
                  className="rounded-2xl bg-[var(--accent)] py-3 font-semibold text-white disabled:opacity-60"
                  disabled={isPending || !resultLink.trim()}
                  type="submit"
                >
                  {t("commonSave")}
                </button>
              </form>
            )}
          </div>
        </div>
      ) : null}

      {detailChallenge ? (
        <div className="fixed inset-0 z-50 flex items-end bg-black/40 p-4 pb-24">
          <div className="max-h-[90vh] w-full overflow-y-auto rounded-3xl surface-panel p-5">
            <div className="mb-4 flex items-center justify-between gap-3">
              <p className="text-lg font-bold">{detailChallenge.tier_list_title}</p>
              <button
                aria-label={t("commonClose")}
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
              className="inline-flex items-center gap-1.5 text-sm font-semibold text-[var(--accent)]"
              href={detailChallenge.tier_list_url}
              rel="noreferrer"
              target="_blank"
            >
              {t("hubTiersOpenOnTierMaker")}
              <ExternalLink aria-hidden className="size-3.5" />
            </Link>

            {detailChallenge.result_url ? (
              <Link
                className="mt-3 inline-flex items-center gap-1.5 rounded-2xl surface-input px-4 py-2.5 text-sm font-semibold"
                href={detailChallenge.result_url}
                rel="noreferrer"
                target="_blank"
              >
                <Link2 aria-hidden className="size-4" />
                {t("hubTiersOpenResultProfile")}
              </Link>
            ) : null}

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
                  {t("hubTiersSaveImage")}
                </a>
              </div>
            ) : null}

            <section className="mt-6">
              <p className="mb-2 font-semibold">{t("hubTiersComments")}</p>
              {detailChallenge.comments.length ? (
                <ul className="grid gap-2">
                  {detailChallenge.comments.map((comment) => (
                    <li className="rounded-2xl surface-input px-3 py-2.5 text-sm" key={comment.id}>
                      <p className="font-semibold">{comment.author_name}</p>
                      <p className="mt-1">{comment.body}</p>
                      <p className="mt-1 text-xs text-[var(--muted)]">
                        {formatDateLocalized(locale, comment.created_at.slice(0, 10))}
                      </p>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-sm text-[var(--muted)]">{t("hubTiersNoComments")}</p>
              )}

              <form className="mt-3 flex gap-2" onSubmit={submitComment}>
                <input
                  className="min-h-11 flex-1 rounded-2xl surface-input px-4 py-2.5 text-sm"
                  onChange={(event) => setCommentDraft(event.target.value)}
                  placeholder={t("hubTiersCommentPlaceholder")}
                  value={commentDraft}
                />
                <button
                  aria-label={t("commonSend")}
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
