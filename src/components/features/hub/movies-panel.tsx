"use client";

import { Plus, Search, Star, X } from "lucide-react";
import { useState, useTransition } from "react";
import { EmptyState } from "@/components/ui/empty-state";
import type { HubMovie, HubMovieCollection, MovieSearchResult } from "@/components/features/hub/types";
import { addMovieEntry, rateMovieEntry } from "@/lib/hub/actions";
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

function RatingPicker({
  value,
  onPick,
  disabled,
}: {
  value: number | undefined;
  onPick: (rating: number) => void;
  disabled?: boolean;
}) {
  return (
    <div className="flex flex-wrap gap-1">
      {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((rating) => (
        <button
          className={`grid size-8 place-items-center rounded-xl text-xs font-semibold ${
            value === rating ? "bg-[var(--accent)] text-white" : "surface-input"
          }`}
          disabled={disabled}
          key={rating}
          onClick={() => onPick(rating)}
          type="button"
        >
          {rating}
        </button>
      ))}
    </div>
  );
}

export function MoviesPanel({ movies, collections, userId, partnerId, partnerName }: MoviesPanelProps) {
  const [tab, setTab] = useState<MoviesTab>("want");
  const [collectionTitle, setCollectionTitle] = useState("");
  const [showSearch, setShowSearch] = useState(false);
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<MovieSearchResult[]>([]);
  const [selected, setSelected] = useState<MovieSearchResult | null>(null);
  const [newRating, setNewRating] = useState(8);
  const [watchModal, setWatchModal] = useState<WatchModalState | null>(null);
  const [collectionPicker, setCollectionPicker] = useState<CollectionPickerState | null>(null);
  const [reviewDrafts, setReviewDrafts] = useState<Record<string, string>>({});
  const [error, setError] = useState("");
  const [isPending, startTransition] = useTransition();

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
        rating: newRating,
      });

      if (!result.ok) {
        setError(result.error ?? "Не удалось добавить фильм.");
        return;
      }

      setShowSearch(false);
      setQuery("");
      setResults([]);
      setSelected(null);
      setNewRating(8);
    });
  }

  function updateRating(movieId: string, rating: number) {
    startTransition(async () => {
      const result = await rateMovieEntry(movieId, rating);
      if (!result.ok) {
        setError(result.error ?? "Не удалось сохранить оценку.");
      }
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
        setError(result.error ?? "Не удалось сохранить.");
        return;
      }
      setWatchModal(null);
    });
  }

  function saveReview(movieId: string) {
    const review = reviewDrafts[movieId] ?? "";
    startTransition(async () => {
      const result = await saveMovieReview(movieId, review);
      if (!result.ok) {
        setError(result.error ?? "Не удалось сохранить отзыв.");
      }
    });
  }

  const wantMovies = movies.filter((movie) => movie.status === "want");
  const watchedMovies = movies.filter((movie) => movie.status === "watched");
  const visibleMovies = tab === "want" ? wantMovies : watchedMovies;

  return (
    <>
      <div className="mb-4 flex gap-2 overflow-x-auto">
        {(
          [
            ["want", "Хотим посмотреть"],
            ["watched", "Просмотрено"],
            ["collections", "Подборки"],
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
          <form
            className="grid gap-2 rounded-3xl surface-panel p-4"
            onSubmit={(event) => {
              event.preventDefault();
              startTransition(async () => {
                const result = await createMovieCollection(collectionTitle);
                if (!result.ok) {
                  setError(result.error ?? "Ошибка");
                  return;
                }
                setCollectionTitle("");
              });
            }}
          >
            <input
              className="rounded-2xl surface-input px-4 py-3"
              onChange={(event) => setCollectionTitle(event.target.value)}
              placeholder="Название подборки"
              value={collectionTitle}
            />
            <button
              className="rounded-2xl bg-[var(--accent)] py-2.5 text-sm font-semibold text-white disabled:opacity-60"
              disabled={!collectionTitle.trim() || isPending}
              type="submit"
            >
              Создать подборку
            </button>
          </form>

          {collections.length ? (
            collections.map((collection) => (
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
                  <p className="mt-3 text-sm text-[var(--muted)]">Пока пусто — добавьте фильмы из «Хотим посмотреть».</p>
                )}

                {wantMovies.length ? (
                  <div className="mt-3">
                    <label className="text-xs font-semibold text-[var(--muted)]">Добавить из списка</label>
                    <select
                      className="mt-1 w-full rounded-xl surface-input px-3 py-2 text-sm"
                      defaultValue=""
                      disabled={isPending}
                      onChange={(event) => {
                        const movieId = event.target.value;
                        if (!movieId) {
                          return;
                        }
                        startTransition(async () => {
                          const result = await addMovieToCollection(collection.id, movieId);
                          if (!result.ok) {
                            setError(result.error ?? "Не удалось добавить.");
                          }
                          event.target.value = "";
                        });
                      }}
                    >
                      <option value="">Выберите фильм…</option>
                      {wantMovies.map((movie) => (
                        <option key={movie.id} value={movie.id}>
                          {movie.title}
                        </option>
                      ))}
                    </select>
                  </div>
                ) : null}
              </article>
            ))
          ) : (
            <EmptyState description="Создайте подборку для фильмов на вечер." title="Подборок пока нет" />
          )}
        </section>
      ) : (
        <section className="grid gap-4">
          {visibleMovies.length ? (
            visibleMovies.map((movie) => {
              const myRating = movie.ratings[userId];
              const partnerRating = movie.ratings[partnerId];
              const myReview = movie.reviews[userId];
              const partnerReview = movie.reviews[partnerId];
              const url = movie.poster_url;

              return (
                <article className="overflow-hidden rounded-3xl surface-panel" key={movie.id}>
                  <div className="flex gap-4 p-4">
                    {url ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img alt="" className="size-28 shrink-0 rounded-2xl object-cover" src={url} />
                    ) : (
                      <div className="grid size-28 shrink-0 place-items-center rounded-2xl bg-[var(--input-bg)] text-2xl">
                        🎬
                      </div>
                    )}
                    <div className="min-w-0 flex-1">
                      <h2 className="font-bold leading-snug">{movie.title}</h2>
                      <div className="mt-3 space-y-3">
                        <div>
                          <p className="mb-1 text-xs font-semibold uppercase tracking-wide text-[var(--muted)]">
                            Ваша оценка
                          </p>
                          <RatingPicker
                            disabled={isPending}
                            onPick={(rating) => updateRating(movie.id, rating)}
                            value={myRating}
                          />
                        </div>
                        <p className="text-sm text-[var(--muted)]">
                          {partnerName}:{" "}
                          {partnerRating ? (
                            <span className="inline-flex items-center gap-1 font-semibold text-[var(--foreground)]">
                              {partnerRating}/10
                              <Star aria-hidden className="size-4 text-[var(--accent)]" fill="currentColor" />
                            </span>
                          ) : (
                            "ещё не оценил(а)"
                          )}
                        </p>

                        {tab === "want" ? (
                          <div className="flex flex-wrap gap-2">
                            <button
                              className="rounded-xl bg-[var(--accent-soft)] px-3 py-2 text-xs font-semibold text-[var(--accent)]"
                              disabled={isPending}
                              onClick={() => openWatchModal(movie)}
                              type="button"
                            >
                              Отметить просмотренным
                            </button>
                            {collections.length ? (
                              <button
                                className="rounded-xl surface-input px-3 py-2 text-xs font-semibold"
                                disabled={isPending}
                                onClick={() =>
                                  setCollectionPicker({ movieId: movie.id, movieTitle: movie.title })
                                }
                                type="button"
                              >
                                В подборку
                              </button>
                            ) : null}
                          </div>
                        ) : null}

                        {tab === "watched" ? (
                          <div className="space-y-2">
                            {myReview ? (
                              <p className="rounded-xl surface-input px-3 py-2 text-sm">
                                <span className="font-semibold">Ваш отзыв: </span>
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
                              placeholder="Ваш отзыв после просмотра…"
                              value={reviewDrafts[movie.id] ?? myReview ?? ""}
                            />
                            <button
                              className="rounded-xl bg-[var(--accent)] px-3 py-2 text-xs font-semibold text-white disabled:opacity-60"
                              disabled={isPending}
                              onClick={() => saveReview(movie.id)}
                              type="button"
                            >
                              Сохранить отзыв
                            </button>
                          </div>
                        ) : null}
                      </div>
                    </div>
                  </div>
                </article>
              );
            })
          ) : (
            <EmptyState
              description={
                tab === "want"
                  ? "Найдите фильм в базе TMDB и добавьте в список."
                  : "Отметьте фильм просмотренным и оставьте отзыв."
              }
              title="Список фильмов пуст"
            />
          )}
        </section>
      )}

      {tab !== "collections" ? (
        <button
          aria-label="Добавить фильм"
          className="fixed bottom-[calc(max(0.75rem,env(safe-area-inset-bottom))+5.25rem)] right-5 z-30 grid size-14 place-items-center rounded-full bg-[var(--accent)] text-white shadow-lg active:scale-95"
          onClick={() => setShowSearch(true)}
          type="button"
        >
          <Plus aria-hidden className="size-7" strokeWidth={2.2} />
        </button>
      ) : null}

      {collectionPicker ? (
        <div className="fixed inset-0 z-50 flex items-end bg-black/40 p-4 pb-[calc(max(0.75rem,env(safe-area-inset-bottom))+5rem)]">
          <div className="w-full max-w-md rounded-3xl surface-panel p-5 shadow-xl">
            <div className="mb-4 flex items-center justify-between">
              <p className="text-lg font-bold">В подборку</p>
              <button
                aria-label="Закрыть"
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
                        setError(result.error ?? "Не удалось добавить.");
                        return;
                      }
                      setCollectionPicker(null);
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
              <p className="text-lg font-bold">Просмотрено</p>
              <button
                aria-label="Закрыть"
                className="grid size-9 place-items-center rounded-full surface-input"
                onClick={() => setWatchModal(null)}
                type="button"
              >
                <X aria-hidden className="size-5" />
              </button>
            </div>
            <p className="mb-3 font-semibold">{watchModal.title}</p>
            <p className="mb-2 text-sm font-semibold">Оценка</p>
            <RatingPicker
              disabled={isPending}
              onPick={(rating) => setWatchModal((current) => (current ? { ...current, rating } : current))}
              value={watchModal.rating}
            />
            <label className="mt-4 block text-sm font-semibold" htmlFor="watch-review">
              Отзыв
            </label>
            <textarea
              className="mt-2 min-h-24 w-full rounded-2xl surface-input px-4 py-3 text-sm"
              id="watch-review"
              onChange={(event) =>
                setWatchModal((current) => (current ? { ...current, review: event.target.value } : current))
              }
              placeholder="Что понравилось или не понравилось?"
              value={watchModal.review}
            />
            <button
              className="mt-4 w-full rounded-2xl bg-[var(--accent)] py-3 font-semibold text-white disabled:opacity-60"
              disabled={isPending}
              type="submit"
            >
              {isPending ? "Сохраняем…" : "Сохранить"}
            </button>
          </form>
        </div>
      ) : null}

      {showSearch ? (
        <div className="fixed inset-0 z-50 flex items-end bg-black/40 p-4 pb-[calc(max(0.75rem,env(safe-area-inset-bottom))+5rem)]">
          <div className="max-h-[85vh] w-full overflow-y-auto rounded-3xl surface-panel p-5 shadow-xl">
            <p className="text-lg font-bold">Добавить фильм</p>
            <div className="relative mt-4">
              <Search
                aria-hidden
                className="pointer-events-none absolute left-4 top-1/2 size-4 -translate-y-1/2 text-[var(--muted)]"
              />
              <input
                className="w-full rounded-2xl surface-input py-3 pl-11 pr-4"
                onChange={(event) => void searchMovies(event.target.value)}
                placeholder="Поиск по названию..."
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

            {selected ? (
              <div className="mt-4 rounded-2xl bg-[var(--input-bg)] p-3">
                <p className="text-sm font-semibold">Ваша оценка</p>
                <div className="mt-2">
                  <RatingPicker onPick={setNewRating} value={newRating} />
                </div>
              </div>
            ) : null}

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
                Отмена
              </button>
              <button
                className="rounded-2xl bg-[var(--accent)] px-4 py-3 font-semibold text-white disabled:opacity-60"
                disabled={!selected || isPending}
                onClick={addMovie}
                type="button"
              >
                {isPending ? "Сохраняем..." : "Добавить"}
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
}
