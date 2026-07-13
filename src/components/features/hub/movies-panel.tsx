"use client";

import { Check, Plus, Search, X } from "lucide-react";
import { useRouter } from "next/navigation";
import { useMemo, useState, useTransition } from "react";
import { useLanguage } from "@/components/providers/language-provider";
import { EmptyState } from "@/components/ui/empty-state";
import { RatingDisplay, RatingInput } from "@/components/ui/rating-stars";
import type { HubMovie, HubMovieCollection, MovieSearchResult } from "@/components/features/hub/types";
import { addMovieEntry } from "@/lib/hub/actions";
import {
  addMovieToCollection,
  createMovieCollection,
  markMovieWatched,
  saveMovieReview,
} from "@/lib/hub/extended-actions";

type MoviesPanelProps = {
  movies: HubMovie[];
  collections: HubMovieCollection[];
  userId: string;
  partnerId: string;
  partnerName: string;
};

type MoviesTab = "want" | "watched" | "collections";

type WatchModalState = {
  movieId: string;
  title: string;
  rating: number;
  review: string;
};

type CollectionPickerState = {
  movieId: string;
  movieTitle: string;
};

function posterUrl(path: string | null) {
  return path ? `https://image.tmdb.org/t/p/w342${path}` : null;
}

function sortWatchedMovies(movies: HubMovie[], userId: string, partnerId: string) {
  return [...movies].sort((a, b) => {
    const aMissing = !a.ratings[userId] || !a.ratings[partnerId];
    const bMissing = !b.ratings[userId] || !b.ratings[partnerId];
    if (aMissing !== bMissing) {
      return aMissing ? -1 : 1;
    }
    return 0;
  });
}

function MoviePoster({ url, size = "card" }: { url: string | null; size?: "card" | "thumb" }) {
  const cardClass = size === "card" ? "size-28 shrink-0 rounded-2xl" : "size-12 shrink-0 rounded-xl";

  if (url) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img alt="" className={`${cardClass} object-cover`} src={url} />
    );
  }

  return (
    <div className={`grid ${cardClass} place-items-center bg-[var(--input-bg)] ${size === "card" ? "text-2xl" : "text-base"}`}>
      🎬
    </div>
  );
}

export function MoviesPanel({ movies, collections, userId, partnerId, partnerName }: MoviesPanelProps) {
  const [tab, setTab] = useState<MoviesTab>("want");
  const [showCreateCollection, setShowCreateCollection] = useState(false);
  const [collectionTitle, setCollectionTitle] = useState("");
  const [selectedMovieIds, setSelectedMovieIds] = useState<string[]>([]);
  const [showSearch, setShowSearch] = useState(false);
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<MovieSearchResult[]>([]);
  const [selected, setSelected] = useState<MovieSearchResult | null>(null);
  const [watchModal, setWatchModal] = useState<WatchModalState | null>(null);
  const [collectionPicker, setCollectionPicker] = useState<CollectionPickerState | null>(null);
  const [reviewDrafts, setReviewDrafts] = useState<Record<string, string>>({});
  const [error, setError] = useState("");
  const [isPending, startTransition] = useTransition();
  const router = useRouter();
  const { t } = useLanguage();

  const wantMovies = useMemo(() => movies.filter((movie) => movie.status === "want"), [movies]);
  const watchedMovies = useMemo(
    () => sortWatchedMovies(
      movies.filter((movie) => movie.status === "watched"),
      userId,
      partnerId,
    ),
    [movies, userId, partnerId],
  );

  async function searchMovies(value: string) {
    setQuery(value);
    if (value.trim().length < 2) {
      setResults([]);
      return;
    }

    const response = await fetch(`/api/movies/search?q=${encodeURIComponent(value.trim())}`);
    const payload = (await response.json()) as { results?: MovieSearchResult[]; error?: string };
    if (payload.error) {
      setError(payload.error);
    }
    setResults(payload.results ?? []);
  }

  function addMovie() {
    if (!selected) {
      return;
    }

    setError("");
    startTransition(async () => {
      const result = await addMovieEntry({
        tmdbId: selected.id,
        title: selected.title,
        posterPath: selected.posterPath,
        rating: 8,
      });

      if (!result.ok) {
        setError(result.error ?? t("moviesErrorAdd"));
        return;
      }

      setShowSearch(false);
      setQuery("");
      setResults([]);
      setSelected(null);
      router.refresh();
    });
  }

  function openWatchModal(movie: HubMovie) {
    setWatchModal({
      movieId: movie.id,
      title: movie.title,
      rating: movie.ratings[userId] ?? 8,
      review: movie.reviews[userId] ?? "",
    });
  }

  function submitWatchModal(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!watchModal) {
      return;
    }

    setError("");
    startTransition(async () => {
      const result = await markMovieWatched(watchModal.movieId, watchModal.rating, watchModal.review);
      if (!result.ok) {
        setError(result.error ?? t("hubErrorSave"));
        return;
      }
      setWatchModal(null);
      router.refresh();
    });
  }

  function saveReview(movieId: string) {
    const review = reviewDrafts[movieId] ?? "";
    startTransition(async () => {
      const result = await saveMovieReview(movieId, review);
      if (!result.ok) {
        setError(result.error ?? t("hubErrorReview"));
        return;
      }
      router.refresh();
    });
  }

  function toggleMovieSelection(movieId: string) {
    setSelectedMovieIds((current) =>
      current.includes(movieId) ? current.filter((id) => id !== movieId) : [...current, movieId],
    );
  }

  function submitCreateCollection(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    startTransition(async () => {
      const result = await createMovieCollection(collectionTitle, selectedMovieIds);
      if (!result.ok) {
        setError(result.error ?? t("hubErrorCollection"));
        return;
      }
      setShowCreateCollection(false);
      setCollectionTitle("");
      setSelectedMovieIds([]);
      router.refresh();
    });
  }

  return (
    <>
      <div className="mb-4 flex gap-2 overflow-x-auto">
        {(
          [
            ["want", t("moviesWantWatch")],
            ["watched", t("moviesWatchedTab")],
            ["collections", t("moviesCollections")],
          ] as const
        ).map(([key, label]) => (
          <button
            className={`shrink-0 rounded-2xl px-4 py-2 text-sm font-semibold ${tab === key ? "bg-[var(--accent)] text-white" : "surface-input"}`}
            key={key}
            onClick={() => setTab(key)}
            type="button"
          >
            {label}
          </button>
        ))}
      </div>

      {error ? <p className="mb-3 alert-error rounded-xl px-3 py-2 text-sm">{error}</p> : null}

      {tab === "collections" ? (
        <section className="grid gap-3">
          {collections.length ? (
            <div className="grid gap-3">
              {collections.map((collection) => (
                <article className="rounded-3xl surface-panel p-4" key={collection.id}>
                  <div>
                    <p className="font-bold">{collection.title}</p>
                    <p className="mt-1 text-xs text-[var(--muted)]">{collection.author_name}</p>
                  </div>

                  {collection.items.length ? (
                    <div className="mt-3 grid grid-cols-3 gap-2">
                      {collection.items.map((item) => (
                        <figure className="overflow-hidden rounded-xl" key={item.id}>
                          {item.poster_url ? (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img alt="" className="aspect-[2/3] w-full object-cover" src={item.poster_url} />
                          ) : (
                            <div className="grid aspect-[2/3] place-items-center bg-[var(--input-bg)] text-xl">🎬</div>
                          )}
                          <figcaption className="mt-1 line-clamp-2 text-[11px] font-medium">{item.title}</figcaption>
                        </figure>
                      ))}
                    </div>
                  ) : (
                    <p className="mt-3 text-sm text-[var(--muted)]">{t("hubEmptyShort")}</p>
                  )}
                </article>
              ))}
            </div>
          ) : (
            <EmptyState description={t("hubCollectionEmptyDesc")} title={t("hubCollectionEmpty")} />
          )}
        </section>
      ) : tab === "want" ? (
        <section className="grid gap-4">
          {wantMovies.length ? (
            wantMovies.map((movie) => (
              <article className="overflow-hidden rounded-3xl surface-panel" key={movie.id}>
                <div className="flex gap-4 p-4">
                  <MoviePoster url={movie.poster_url} />
                  <div className="min-w-0 flex-1">
                    <h2 className="font-bold leading-snug">{movie.title}</h2>
                    <div className="mt-3 flex flex-wrap gap-2">
                      <button
                        className="rounded-xl bg-[var(--accent)] px-3 py-2.5 text-xs font-semibold text-white disabled:opacity-60"
                        disabled={isPending}
                        onClick={() => openWatchModal(movie)}
                        type="button"
                      >
                        {t("hubWatched")}
                      </button>
                      {collections.length ? (
                        <button
                          className="rounded-xl surface-input px-3 py-2.5 text-xs font-semibold"
                          disabled={isPending}
                          onClick={() =>
                            setCollectionPicker({ movieId: movie.id, movieTitle: movie.title })
                          }
                          type="button"
                        >
                          {t("hubToCollection")}
                        </button>
                      ) : null}
                    </div>
                  </div>
                </div>
              </article>
            ))
          ) : (
            <EmptyState
              description={t("moviesListEmptyDesc")}
              title={t("moviesListEmpty")}
            />
          )}
        </section>
      ) : (
        <section className="grid gap-4">
          {watchedMovies.length ? (
            watchedMovies.map((movie) => {
              const myRating = movie.ratings[userId];
              const partnerRating = movie.ratings[partnerId];
              const myReview = movie.reviews[userId];
              const partnerReview = movie.reviews[partnerId];

              return (
                <article className="overflow-hidden rounded-3xl surface-panel" key={movie.id}>
                  <div className="flex gap-4 p-4">
                    <MoviePoster url={movie.poster_url} />
                    <div className="min-w-0 flex-1">
                      <h2 className="font-bold leading-snug">{movie.title}</h2>
                      <div className="mt-3 space-y-2">
                        <RatingDisplay label={t("commonYou")} value={myRating} />
                        <RatingDisplay label={partnerName} value={partnerRating} />
                      </div>
                    </div>
                  </div>

                  <div className="space-y-2 border-t border-[var(--border)] px-4 py-4">
                    {myReview ? (
                      <p className="rounded-xl surface-input px-3 py-2 text-sm">
                        <span className="font-semibold">{t("hubYourReviewLabel")} </span>
                        {myReview}
                      </p>
                    ) : null}
                    {partnerReview ? (
                      <p className="rounded-xl surface-input px-3 py-2 text-sm">
                        <span className="font-semibold">{partnerName}: </span>
                        {partnerReview}
                      </p>
                    ) : null}
                    <textarea
                      className="min-h-20 w-full rounded-xl surface-input px-3 py-2 text-sm"
                      onChange={(event) =>
                        setReviewDrafts((current) => ({
                          ...current,
                          [movie.id]: event.target.value,
                        }))
                      }
                      placeholder={t("hubReviewAfter")}
                      value={reviewDrafts[movie.id] ?? myReview ?? ""}
                    />
                    <button
                      className="rounded-xl bg-[var(--accent)] px-3 py-2.5 text-xs font-semibold text-white disabled:opacity-60"
                      disabled={isPending}
                      onClick={() => saveReview(movie.id)}
                      type="button"
                    >
                      {t("hubSaveReview")}
                    </button>
                  </div>
                </article>
              );
            })
          ) : (
            <EmptyState
              description={t("moviesWatchedEmptyDesc")}
              title={t("moviesWatchedEmpty")}
            />
          )}
        </section>
      )}

      {tab === "want" ? (
        <button
          aria-label={t("moviesAddMovie")}
          className="fixed bottom-[calc(max(0.75rem,env(safe-area-inset-bottom))+5.25rem)] right-5 z-30 grid size-14 place-items-center rounded-full bg-[var(--accent)] text-white shadow-lg active:scale-95"
          onClick={() => setShowSearch(true)}
          type="button"
        >
          <Plus aria-hidden className="size-7" strokeWidth={2.2} />
        </button>
      ) : null}

      {tab === "collections" ? (
        <button
          aria-label={t("hubCreateCollection")}
          className="fixed bottom-[calc(max(0.75rem,env(safe-area-inset-bottom))+5.25rem)] right-5 z-30 grid size-14 place-items-center rounded-full bg-[var(--accent)] text-white shadow-lg active:scale-95"
          onClick={() => setShowCreateCollection(true)}
          type="button"
        >
          <Plus aria-hidden className="size-7" strokeWidth={2.2} />
        </button>
      ) : null}

      {collectionPicker ? (
        <div className="fixed inset-0 z-50 flex items-end bg-black/40 p-4 pb-[calc(max(0.75rem,env(safe-area-inset-bottom))+5rem)]">
          <div className="w-full max-w-md rounded-3xl surface-panel p-5 shadow-xl">
            <div className="mb-4 flex items-center justify-between">
              <p className="text-lg font-bold">{t("hubToCollection")}</p>
              <button
                aria-label={t("commonClose")}
                className="grid size-9 place-items-center rounded-full surface-input"
                onClick={() => setCollectionPicker(null)}
                type="button"
              >
                <X aria-hidden className="size-5" />
              </button>
            </div>
            <p className="mb-3 text-sm text-[var(--muted)]">{collectionPicker.movieTitle}</p>
            <div className="grid gap-2">
              {collections.map((collection) => (
                <button
                  className="rounded-2xl surface-input px-4 py-3 text-left font-semibold disabled:opacity-60"
                  disabled={isPending}
                  key={collection.id}
                  onClick={() =>
                    startTransition(async () => {
                      const result = await addMovieToCollection(collection.id, collectionPicker.movieId);
                      if (!result.ok) {
                        setError(result.error ?? t("hubErrorAdd"));
                        return;
                      }
                      setCollectionPicker(null);
                      router.refresh();
                    })
                  }
                  type="button"
                >
                  {collection.title}
                </button>
              ))}
            </div>
          </div>
        </div>
      ) : null}

      {watchModal ? (
        <div className="fixed inset-0 z-50 flex items-end bg-black/40 p-4 pb-[calc(max(0.75rem,env(safe-area-inset-bottom))+5rem)]">
          <form className="w-full max-w-md rounded-3xl surface-panel p-5 shadow-xl" onSubmit={submitWatchModal}>
            <div className="mb-4 flex items-center justify-between">
              <p className="text-lg font-bold">{t("hubWatched")}</p>
              <button
                aria-label={t("commonClose")}
                className="grid size-9 place-items-center rounded-full surface-input"
                onClick={() => setWatchModal(null)}
                type="button"
              >
                <X aria-hidden className="size-5" />
              </button>
            </div>
            <p className="mb-3 font-semibold">{watchModal.title}</p>
            <p className="mb-2 text-sm font-semibold">{t("ratingLabel")}</p>
            <RatingInput
              disabled={isPending}
              onChange={(rating) => setWatchModal((current) => (current ? { ...current, rating } : current))}
              value={watchModal.rating}
            />
            <label className="mt-4 block text-sm font-semibold" htmlFor="watch-review">
              {t("hubYourReview")}
            </label>
            <textarea
              className="mt-2 min-h-24 w-full rounded-2xl surface-input px-4 py-3 text-sm"
              id="watch-review"
              onChange={(event) =>
                setWatchModal((current) => (current ? { ...current, review: event.target.value } : current))
              }
              placeholder={t("hubReviewPlaceholder")}
              value={watchModal.review}
            />
            <button
              className="mt-4 w-full rounded-2xl bg-[var(--accent)] py-3 font-semibold text-white disabled:opacity-60"
              disabled={isPending}
              type="submit"
            >
              {isPending ? t("commonSaving") : t("commonSave")}
            </button>
          </form>
        </div>
      ) : null}

      {showCreateCollection ? (
        <div className="fixed inset-0 z-50 flex items-end bg-black/40 p-4 pb-[calc(max(0.75rem,env(safe-area-inset-bottom))+5rem)]">
          <form
            className="max-h-[85vh] w-full max-w-md overflow-y-auto rounded-3xl surface-panel p-5 shadow-xl"
            onSubmit={submitCreateCollection}
          >
            <div className="mb-4 flex items-center justify-between">
              <p className="text-lg font-bold">{t("moviesCreateCollection")}</p>
              <button
                aria-label={t("commonClose")}
                className="grid size-9 place-items-center rounded-full surface-input"
                onClick={() => {
                  setShowCreateCollection(false);
                  setCollectionTitle("");
                  setSelectedMovieIds([]);
                }}
                type="button"
              >
                <X aria-hidden className="size-5" />
              </button>
            </div>
            <input
              className="w-full rounded-2xl surface-input px-4 py-3"
              onChange={(event) => setCollectionTitle(event.target.value)}
              placeholder={t("hubCollectionName")}
              required
              value={collectionTitle}
            />
            {wantMovies.length ? (
              <div className="mt-4">
                <p className="mb-2 text-sm font-semibold">{t("moviesFromWantList")}</p>
                <div className="grid max-h-56 gap-2 overflow-y-auto">
                  {wantMovies.map((movie) => {
                    const checked = selectedMovieIds.includes(movie.id);
                    return (
                      <label
                        className={`flex cursor-pointer items-center gap-3 rounded-2xl px-3 py-2.5 ${checked ? "bg-[var(--accent-soft)]" : "surface-input"}`}
                        key={movie.id}
                      >
                        <input
                          checked={checked}
                          className="size-4 accent-[var(--accent)]"
                          onChange={() => toggleMovieSelection(movie.id)}
                          type="checkbox"
                        />
                        <span className="min-w-0 flex-1 text-sm font-medium">{movie.title}</span>
                        {checked ? <Check aria-hidden className="size-4 text-[var(--accent)]" /> : null}
                      </label>
                    );
                  })}
                </div>
              </div>
            ) : (
              <p className="mt-4 text-sm text-[var(--muted)]">{t("moviesWantListHint")}</p>
            )}
            <button
              className="mt-4 w-full rounded-2xl bg-[var(--accent)] py-3 font-semibold text-white disabled:opacity-60"
              disabled={!collectionTitle.trim() || isPending}
              type="submit"
            >
              {isPending ? t("hubCreating") : t("moviesCreateCollection")}
            </button>
          </form>
        </div>
      ) : null}

      {showSearch ? (
        <div className="fixed inset-0 z-50 flex items-end bg-black/40 p-4 pb-[calc(max(0.75rem,env(safe-area-inset-bottom))+5rem)]">
          <div className="max-h-[85vh] w-full overflow-y-auto rounded-3xl surface-panel p-5 shadow-xl">
            <p className="text-lg font-bold">{t("moviesAddMovieTitle")}</p>
            <div className="relative mt-4">
              <Search
                aria-hidden
                className="pointer-events-none absolute left-4 top-1/2 size-4 -translate-y-1/2 text-[var(--muted)]"
              />
              <input
                className="w-full rounded-2xl surface-input py-3 pl-11 pr-4"
                onChange={(event) => void searchMovies(event.target.value)}
                placeholder={t("hubSearchPlaceholder")}
                value={query}
              />
            </div>

            <div className="mt-3 grid max-h-56 gap-2 overflow-y-auto">
              {results.map((movie) => {
                const resultPoster = posterUrl(movie.posterPath);
                const active = selected?.id === movie.id;

                return (
                  <button
                    className={`flex items-center gap-3 rounded-2xl p-2 text-left ${
                      active ? "bg-[var(--accent-soft)]" : "surface-input"
                    }`}
                    key={movie.id}
                    onClick={() => setSelected(movie)}
                    type="button"
                  >
                    {resultPoster ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img alt="" className="size-12 rounded-xl object-cover" src={resultPoster} />
                    ) : (
                      <div className="grid size-12 place-items-center rounded-xl bg-[var(--input-bg)]">🎬</div>
                    )}
                    <div>
                      <p className="font-semibold">{movie.title}</p>
                      {movie.releaseDate ? (
                        <p className="text-xs text-[var(--muted)]">{movie.releaseDate.slice(0, 4)}</p>
                      ) : null}
                    </div>
                  </button>
                );
              })}
            </div>

            <div className="mt-4 grid grid-cols-2 gap-2">
              <button
                className="rounded-2xl surface-input px-4 py-3 font-semibold"
                onClick={() => {
                  setShowSearch(false);
                  setSelected(null);
                  setQuery("");
                  setResults([]);
                }}
                type="button"
              >
                {t("commonCancel")}
              </button>
              <button
                className="rounded-2xl bg-[var(--accent)] px-4 py-3 font-semibold text-white disabled:opacity-60"
                disabled={!selected || isPending}
                onClick={addMovie}
                type="button"
              >
                {isPending ? t("commonSaving") : t("commonAdd")}
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
}
