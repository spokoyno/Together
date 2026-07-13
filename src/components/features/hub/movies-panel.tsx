"use client";

import { Plus, Search, Star } from "lucide-react";
import { useState, useTransition } from "react";
import { EmptyState } from "@/components/ui/empty-state";
import type { HubMovie, MovieSearchResult } from "@/components/features/hub/types";
import { addMovieEntry, rateMovieEntry } from "@/lib/hub/actions";

type MoviesPanelProps = {
  movies: HubMovie[];
  userId: string;
  partnerId: string;
  partnerName: string;
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

export function MoviesPanel({ movies, userId, partnerId, partnerName }: MoviesPanelProps) {
  const [showSearch, setShowSearch] = useState(false);
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<MovieSearchResult[]>([]);
  const [selected, setSelected] = useState<MovieSearchResult | null>(null);
  const [newRating, setNewRating] = useState(8);
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

  return (
    <>
      <section className="grid gap-4">
        {movies.length ? (
          movies.map((movie) => {
            const myRating = movie.ratings[userId];
            const partnerRating = movie.ratings[partnerId];
            const url = movie.poster_url;

            return (
              <article className="overflow-hidden rounded-3xl surface-panel" key={movie.id}>
                <div className="flex gap-4 p-4">
                  {url ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      alt=""
                      className="size-28 shrink-0 rounded-2xl object-cover"
                      src={url}
                    />
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
                    </div>
                  </div>
                </div>
              </article>
            );
          })
        ) : (
          <EmptyState
            description="Найдите фильм в базе TMDB и добавьте свою оценку."
            title="Список фильмов пуст"
          />
        )}
      </section>

      <button
        aria-label="Добавить фильм"
        className="fixed bottom-[calc(max(0.75rem,env(safe-area-inset-bottom))+5.25rem)] right-5 z-30 grid size-14 place-items-center rounded-full bg-[var(--accent)] text-white shadow-lg active:scale-95"
        onClick={() => setShowSearch(true)}
        type="button"
      >
        <Plus aria-hidden className="size-7" strokeWidth={2.2} />
      </button>

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
                const url = posterUrl(movie.posterPath);
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
                    {url ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img alt="" className="size-12 rounded-xl object-cover" src={url} />
                    ) : (
                      <div className="grid size-12 place-items-center rounded-xl bg-[var(--input-bg)]">
                        🎬
                      </div>
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

            {error ? <p className="mt-3 alert-error rounded-xl px-3 py-2 text-sm">{error}</p> : null}

            <div className="mt-4 grid grid-cols-2 gap-2">
              <button
                className="rounded-2xl surface-input px-4 py-3 font-semibold"
                onClick={() => {
                  setShowSearch(false);
                  setSelected(null);
                  setQuery("");
                  setResults([]);
                  setError("");
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
