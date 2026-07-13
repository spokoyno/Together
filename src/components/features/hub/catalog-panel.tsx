"use client";

import { Plus, Search, X } from "lucide-react";
import { useRouter } from "next/navigation";
import { useMemo, useState, useTransition } from "react";
import { EmptyState } from "@/components/ui/empty-state";
import { RatingDisplay, RatingInput } from "@/components/ui/rating-stars";
import type { CatalogConfig, CatalogEntry, CatalogSearchResult } from "@/lib/hub/catalog";
import { addCatalogEntry, markCatalogCompleted, saveCatalogReview } from "@/lib/hub/catalog-actions";

type CatalogPanelProps = {
  config: CatalogConfig;
  entries: CatalogEntry[];
  userId: string;
  partnerId: string;
  partnerName: string;
};

type CatalogTab = "want" | "completed";

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

const KIND_EMOJI: Record<CatalogConfig["kind"], string> = {
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
}: CatalogPanelProps) {
  const [tab, setTab] = useState<CatalogTab>("want");
  const [showSearch, setShowSearch] = useState(false);
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<CatalogSearchResult[]>([]);
  const [addModal, setAddModal] = useState<AddModalState | null>(null);
  const [completeModal, setCompleteModal] = useState<CompleteModalState | null>(null);
  const [reviewDrafts, setReviewDrafts] = useState<Record<string, string>>({});
  const [error, setError] = useState("");
  const [isPending, startTransition] = useTransition();
  const router = useRouter();

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
        setError(result.error ?? "Не удалось добавить.");
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
        setError(result.error ?? "Не удалось сохранить.");
        return;
      }
      setCompleteModal(null);
      router.refresh();
    });
  }

  function saveReview(entryId: string) {
    startTransition(async () => {
      const result = await saveCatalogReview(entryId, config.kind, reviewDrafts[entryId] ?? "");
      if (!result.ok) {
        setError(result.error ?? "Не удалось сохранить отзыв.");
        return;
      }
      router.refresh();
    });
  }

  const visible = tab === "want" ? wantItems : completedItems;

  return (
    <>
      <div className="mb-4 flex gap-2 overflow-x-auto">
        <button
          className={`shrink-0 rounded-2xl px-4 py-2 text-sm font-semibold ${tab === "want" ? "bg-[var(--accent)] text-white" : "surface-input"}`}
          onClick={() => setTab("want")}
          type="button"
        >
          {config.wantTab}
        </button>
        <button
          className={`shrink-0 rounded-2xl px-4 py-2 text-sm font-semibold ${tab === "completed" ? "bg-[var(--accent)] text-white" : "surface-input"}`}
          onClick={() => setTab("completed")}
          type="button"
        >
          {config.completedTab}
        </button>
      </div>

      {error ? <p className="mb-3 alert-error rounded-xl px-3 py-2 text-sm">{error}</p> : null}

      <section className="grid gap-4">
        {visible.length ? (
          visible.map((entry) => (
            <article className="overflow-hidden rounded-3xl surface-panel" key={entry.id}>
              <div className="flex gap-4 p-4">
                <Poster emoji={emoji} url={entry.poster_url} />
                <div className="min-w-0 flex-1">
                  <h2 className="font-bold leading-snug">{entry.title}</h2>
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
                      {config.completedAction}
                    </button>
                  ) : (
                    <div className="mt-3 space-y-2">
                      <RatingDisplay label="Вы" value={entry.ratings[userId]} />
                      <RatingDisplay label={partnerName} value={entry.ratings[partnerId]} />
                    </div>
                  )}
                </div>
              </div>

              {tab === "completed" ? (
                <div className="space-y-2 border-t border-[var(--border)] px-4 py-4">
                  {entry.reviews[userId] ? (
                    <p className="rounded-xl surface-input px-3 py-2 text-sm">
                      <span className="font-semibold">Ваш отзыв: </span>
                      {entry.reviews[userId]}
                    </p>
                  ) : null}
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
                    placeholder="Ваш отзыв…"
                    value={reviewDrafts[entry.id] ?? entry.reviews[userId] ?? ""}
                  />
                  <button
                    className="rounded-xl bg-[var(--accent)] px-3 py-2.5 text-xs font-semibold text-white disabled:opacity-60"
                    disabled={isPending}
                    onClick={() => saveReview(entry.id)}
                    type="button"
                  >
                    Сохранить отзыв
                  </button>
                </div>
              ) : null}
            </article>
          ))
        ) : (
          <EmptyState
            description={tab === "want" ? config.emptyWant : config.emptyCompleted}
            title="Пока пусто"
          />
        )}
      </section>

      {tab === "want" ? (
        <button
          aria-label="Добавить"
          className="fixed bottom-[calc(max(0.75rem,env(safe-area-inset-bottom))+5.25rem)] right-5 z-30 grid size-14 place-items-center rounded-full bg-[var(--accent)] text-white shadow-lg"
          onClick={() => setShowSearch(true)}
          type="button"
        >
          <Plus aria-hidden className="size-7" />
        </button>
      ) : null}

      {showSearch ? (
        <div className="fixed inset-0 z-50 flex flex-col bg-[var(--background)]">
          <div className="flex items-center gap-2 border-b border-[var(--border)] px-4 py-3">
            <Search aria-hidden className="size-5 shrink-0 text-[var(--muted)]" />
            <input
              autoFocus
              className="min-w-0 flex-1 bg-transparent text-base outline-none"
              onChange={(event) => void search(event.target.value)}
              placeholder={config.searchPlaceholder}
              value={query}
            />
            <button
              aria-label="Закрыть"
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
              <p className="text-center text-sm text-[var(--muted)]">Ничего не найдено</p>
            ) : (
              <p className="text-center text-sm text-[var(--muted)]">Введите минимум 2 символа</p>
            )}
          </div>
        </div>
      ) : null}

      {addModal ? (
        <div className="fixed inset-0 z-[60] flex items-end bg-black/40 p-4 pb-24">
          <form className="w-full rounded-3xl surface-panel p-5" onSubmit={submitAdd}>
            <p className="text-lg font-bold">{addModal.item.title}</p>
            <p className="mt-2 text-sm text-[var(--muted)]">Ваша оценка</p>
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
              Добавить
            </button>
          </form>
        </div>
      ) : null}

      {completeModal ? (
        <div className="fixed inset-0 z-[60] flex items-end bg-black/40 p-4 pb-24">
          <form className="w-full rounded-3xl surface-panel p-5" onSubmit={submitComplete}>
            <p className="text-lg font-bold">{completeModal.title}</p>
            <p className="mt-2 text-sm text-[var(--muted)]">Ваша оценка</p>
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
              placeholder="Отзыв (необязательно)"
              value={completeModal.review}
            />
            <button
              className="mt-4 w-full rounded-2xl bg-[var(--accent)] py-3 font-semibold text-white disabled:opacity-60"
              disabled={isPending}
              type="submit"
            >
              {config.completedAction}
            </button>
          </form>
        </div>
      ) : null}
    </>
  );
}
