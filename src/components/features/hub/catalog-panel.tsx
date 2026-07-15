"use client";

import { Plus, Search, X } from "lucide-react";
import { useRouter } from "next/navigation";
import { useMemo, useState, useTransition } from "react";
import { useLanguage } from "@/components/providers/language-provider";
import { SharedCollectionsPanel } from "@/components/features/hub/shared-collections-panel";
import { EmptyState } from "@/components/ui/empty-state";
import { ConfirmDeleteButton } from "@/components/ui/confirm-delete-button";
import { TabGrid } from "@/components/ui/tab-grid";
import { RatingDisplay, RatingInput } from "@/components/ui/rating-stars";
import type { CatalogPanelConfig, CatalogEntry, CatalogSearchResult } from "@/lib/hub/catalog";
import { ModalSheet } from "@/components/ui/modal-sheet";
import { addCatalogEntry, deleteCatalogEntry, markCatalogCompleted, saveCatalogReview, updateCatalogRating } from "@/lib/hub/catalog-actions";

type CatalogPanelProps = {
  config: CatalogPanelConfig;
  entries: CatalogEntry[];
  userId: string;
  partnerId: string;
  partnerName: string;
  isAdmin?: boolean;
};

type CatalogTab = "want" | "completed" | "community";

type CompleteModalState = {
  entryId: string;
  title: string;
  rating: number;
  review: string;
};

type AddModalState = {
  item: CatalogSearchResult;
  rating: number;
};

function Poster({ url, emoji }: { url: string | null; emoji: string }) {
  if (url) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img alt="" className="size-28 shrink-0 rounded-2xl object-cover" src={url} />
    );
  }

  return (
    <div className="grid size-28 shrink-0 place-items-center rounded-2xl bg-[var(--accent-soft)] text-2xl">
      {emoji}
    </div>
  );
}

const KIND_EMOJI: Record<CatalogPanelConfig["kind"], string> = {
  game: "🎮",
  tv_series: "📺",
  cartoon_series: "🎨",
  anime: "✨",
};

export function CatalogPanel({
  config,
  entries,
  userId,
  partnerId,
  partnerName,
  isAdmin = false,
}: CatalogPanelProps) {
  const [tab, setTab] = useState<CatalogTab>("want");
  const [showSearch, setShowSearch] = useState(false);
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<CatalogSearchResult[]>([]);
  const [addModal, setAddModal] = useState<AddModalState | null>(null);
  const [completeModal, setCompleteModal] = useState<CompleteModalState | null>(null);
  const [reviewDrafts, setReviewDrafts] = useState<Record<string, string>>({});
  const [ratingDrafts, setRatingDrafts] = useState<Record<string, number>>({});
  const [error, setError] = useState("");
  const [isPending, startTransition] = useTransition();
  const router = useRouter();
  const { t } = useLanguage();

  const wantItems = useMemo(() => entries.filter((e) => e.status === "want"), [entries]);
  const completedItems = useMemo(() => entries.filter((e) => e.status === "completed"), [entries]);
  const emoji = KIND_EMOJI[config.kind];

  async function search(value: string) {
    setQuery(value);
    if (value.trim().length < 2) {
      setResults([]);
      return;
    }

    const response = await fetch(`${config.searchPath}?q=${encodeURIComponent(value.trim())}`);
    const payload = (await response.json()) as {
      results?: CatalogSearchResult[];
      error?: string;
    };
    if (payload.error) {
      setError(payload.error);
    }
    setResults(payload.results ?? []);
  }

  function submitAdd(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!addModal) {
      return;
    }

    setError("");
    startTransition(async () => {
      const result = await addCatalogEntry({
        kind: config.kind,
        externalId: addModal.item.id,
        title: addModal.item.title,
        posterUrl: addModal.item.posterUrl,
        rating: addModal.rating,
      });
      if (!result.ok) {
        setError(result.error ?? t("hubErrorAdd"));
        return;
      }
      setAddModal(null);
      setShowSearch(false);
      setQuery("");
      setResults([]);
      router.refresh();
    });
  }

  function submitComplete(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!completeModal) {
      return;
    }

    setError("");
    startTransition(async () => {
      const result = await markCatalogCompleted(
        completeModal.entryId,
        config.kind,
        completeModal.rating,
        completeModal.review,
      );
      if (!result.ok) {
        setError(result.error ?? t("hubErrorSave"));
        return;
      }
      setCompleteModal(null);
      router.refresh();
    });
  }

  function saveFeedback(entryId: string) {
    const review = reviewDrafts[entryId] ?? "";
    const entry = completedItems.find((row) => row.id === entryId);
    const rating = ratingDrafts[entryId] ?? entry?.ratings[userId] ?? 8;

    startTransition(async () => {
      const ratingResult = await updateCatalogRating(entryId, config.kind, rating);
      if (!ratingResult.ok) {
        setError(ratingResult.error ?? t("hubErrorSave"));
        return;
      }
      const reviewResult = await saveCatalogReview(entryId, config.kind, review);
      if (!reviewResult.ok) {
        setError(reviewResult.error ?? t("hubErrorReview"));
        return;
      }
      router.refresh();
    });
  }

  function removeEntry(entryId: string) {
    startTransition(async () => {
      const result = await deleteCatalogEntry(entryId, config.kind);
      if (!result.ok) {
        setError(result.error ?? t("commonErrorGeneric"));
        return;
      }
      router.refresh();
    });
  }

  const visible = tab === "want" ? wantItems : tab === "completed" ? completedItems : [];

  return (
    <>
      <TabGrid
        onChange={setTab}
        tabs={[
          { id: "want", label: t(config.i18n.wantTab) },
          { id: "completed", label: t(config.i18n.completedTab) },
          { id: "community", label: t("sharedCollectionsTab") },
        ]}
        value={tab}
      />

      {tab === "community" ? (
        <SharedCollectionsPanel embedded isAdmin={isAdmin} kind={config.sharedKind} searchPath={config.searchPath} />
      ) : (
        <>
      {error ? <p className="mb-3 alert-error rounded-xl px-3 py-2 text-sm">{error}</p> : null}

      <section className="grid gap-4">
        {visible.length ? (
          visible.map((entry) => (
            <article className="overflow-hidden rounded-3xl surface-panel" key={entry.id}>
              <div className="flex gap-4 p-4">
                <Poster emoji={emoji} url={entry.poster_url} />
                <div className="min-w-0 flex-1">
                  <div className="flex items-start justify-between gap-2">
                    <h2 className="font-bold leading-snug">{entry.title}</h2>
                    <ConfirmDeleteButton disabled={isPending} onConfirm={() => removeEntry(entry.id)} />
                  </div>
                  {tab === "want" ? (
                    <button
                      className="mt-3 rounded-xl bg-[var(--accent)] px-3 py-2.5 text-xs font-semibold text-white disabled:opacity-60"
                      disabled={isPending}
                      onClick={() =>
                        setCompleteModal({
                          entryId: entry.id,
                          title: entry.title,
                          rating: entry.ratings[userId] ?? 8,
                          review: entry.reviews[userId] ?? "",
                        })
                      }
                      type="button"
                    >
                      {t(config.i18n.completedAction)}
                    </button>
                  ) : (
                    <div className="mt-3 space-y-2">
                      <div>
                        <p className="mb-1 text-xs text-[var(--muted)]">{t("commonYou")}</p>
                        <RatingInput
                          onChange={(value) =>
                            setRatingDrafts((current) => ({ ...current, [entry.id]: value }))
                          }
                          value={ratingDrafts[entry.id] ?? entry.ratings[userId] ?? 8}
                        />
                      </div>
                      <RatingDisplay label={partnerName} value={entry.ratings[partnerId]} />
                    </div>
                  )}
                </div>
              </div>

              {tab === "completed" ? (
                <div className="space-y-2 border-t border-[var(--border)] px-4 py-4">
                  {entry.reviews[partnerId] ? (
                    <p className="rounded-xl surface-input px-3 py-2 text-sm">
                      <span className="font-semibold">{partnerName}: </span>
                      {entry.reviews[partnerId]}
                    </p>
                  ) : null}
                  <textarea
                    className="min-h-20 w-full rounded-xl surface-input px-3 py-2 text-sm"
                    onChange={(event) =>
                      setReviewDrafts((current) => ({
                        ...current,
                        [entry.id]: event.target.value,
                      }))
                    }
                    placeholder={t("hubReviewShort")}
                    value={reviewDrafts[entry.id] ?? entry.reviews[userId] ?? ""}
                  />
                  <button
                    className="rounded-xl bg-[var(--accent)] px-3 py-2.5 text-xs font-semibold text-white disabled:opacity-60"
                    disabled={isPending}
                    onClick={() => saveFeedback(entry.id)}
                    type="button"
                  >
                    {t("hubSaveReview")}
                  </button>
                </div>
              ) : null}
            </article>
          ))
        ) : (
          <EmptyState
            description={tab === "want" ? t(config.i18n.emptyWant) : t(config.i18n.emptyCompleted)}
            title={t("hubEmptyShort")}
          />
        )}
      </section>

      {tab === "want" ? (
        <button
          aria-label={t("commonAdd")}
          className="fixed bottom-[calc(max(0.75rem,env(safe-area-inset-bottom))+5.25rem)] right-5 z-30 grid size-14 place-items-center rounded-full bg-[var(--accent)] text-white shadow-lg"
          onClick={() => setShowSearch(true)}
          type="button"
        >
          <Plus aria-hidden className="size-7" />
        </button>
      ) : null}

      {showSearch ? (
        <div
          className="fixed inset-0 z-50 flex flex-col bg-[var(--background)]"
          onClick={() => {
            setShowSearch(false);
            setQuery("");
            setResults([]);
          }}
          role="presentation"
        >
          <div className="flex flex-col flex-1" onClick={(event) => event.stopPropagation()}>
          <div className="flex items-center gap-2 border-b border-[var(--border)] px-4 py-3">
            <Search aria-hidden className="size-5 shrink-0 text-[var(--muted)]" />
            <input
              autoFocus
              className="min-w-0 flex-1 bg-transparent text-base outline-none"
              onChange={(event) => void search(event.target.value)}
              placeholder={t(config.i18n.searchPlaceholder)}
              value={query}
            />
            <button
              aria-label={t("commonClose")}
              className="grid size-9 place-items-center rounded-full surface-input"
              onClick={() => {
                setShowSearch(false);
                setQuery("");
                setResults([]);
              }}
              type="button"
            >
              <X aria-hidden className="size-5" />
            </button>
          </div>
          <div className="flex-1 overflow-y-auto px-4 py-3">
            {results.length ? (
              <div className="grid gap-2">
                {results.map((item) => (
                  <button
                    className="flex items-center gap-3 rounded-2xl surface-panel p-3 text-left"
                    key={item.id}
                    onClick={() => setAddModal({ item, rating: 8 })}
                    type="button"
                  >
                    <Poster emoji={emoji} url={item.posterUrl} />
                    <div className="min-w-0">
                      <p className="font-semibold leading-snug">{item.title}</p>
                      {item.year ? (
                        <p className="mt-1 text-xs text-[var(--muted)]">{item.year}</p>
                      ) : null}
                    </div>
                  </button>
                ))}
              </div>
            ) : query.length >= 2 ? (
              <p className="text-center text-sm text-[var(--muted)]">{t("hubNothingFound")}</p>
            ) : (
              <p className="text-center text-sm text-[var(--muted)]">{t("hubMinTwoChars")}</p>
            )}
          </div>
          </div>
        </div>
      ) : null}

      {addModal ? (
        <ModalSheet as="form" onClose={() => setAddModal(null)} onSubmit={submitAdd} open>
            <p className="text-lg font-bold">{addModal.item.title}</p>
            <p className="mt-2 text-sm text-[var(--muted)]">{t("hubYourRating")}</p>
            <div className="mt-2">
              <RatingInput
                onChange={(rating) => setAddModal((current) => (current ? { ...current, rating } : null))}
                value={addModal.rating}
              />
            </div>
            <button
              className="mt-4 w-full rounded-2xl bg-[var(--accent)] py-3 font-semibold text-white disabled:opacity-60"
              disabled={isPending}
              type="submit"
            >
              {t("commonAdd")}
            </button>
        </ModalSheet>
      ) : null}

      {completeModal ? (
        <ModalSheet as="form" onClose={() => setCompleteModal(null)} onSubmit={submitComplete} open>
            <p className="text-lg font-bold">{completeModal.title}</p>
            <p className="mt-2 text-sm text-[var(--muted)]">{t("hubYourRating")}</p>
            <div className="mt-2">
              <RatingInput
                onChange={(rating) =>
                  setCompleteModal((current) => (current ? { ...current, rating } : null))
                }
                value={completeModal.rating}
              />
            </div>
            <textarea
              className="mt-3 min-h-20 w-full rounded-2xl surface-input px-4 py-3 text-sm"
              onChange={(event) =>
                setCompleteModal((current) =>
                  current ? { ...current, review: event.target.value } : null,
                )
              }
              placeholder={t("hubReviewOptional")}
              value={completeModal.review}
            />
            <button
              className="mt-4 w-full rounded-2xl bg-[var(--accent)] py-3 font-semibold text-white disabled:opacity-60"
              disabled={isPending}
              type="submit"
            >
              {t(config.i18n.completedAction)}
            </button>
        </ModalSheet>
      ) : null}
        </>
      )}
    </>
  );
}
