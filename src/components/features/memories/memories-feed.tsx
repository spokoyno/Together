"use client";

import { useMemo, useState, useTransition } from "react";
import {
  Camera,
  ChefHat,
  Clapperboard,
  Plus,
  Sparkles,
  Star,
  Trash2,
  X,
} from "lucide-react";
import { createMoment, deleteMemory, rateMoment } from "@/lib/memories/actions";
import { formatDateRu } from "@/lib/dates";
import { EmptyState } from "@/components/ui/empty-state";
import type { MomentMeta, MomentType } from "@/types/domain";

export type MemoryFeedItem = {
  id: string;
  title: string | null;
  body: string | null;
  happened_on: string | null;
  media_url: string | null;
  moment_type: MomentType;
  meta: MomentMeta;
  created_at: string;
  author_name: string;
};

type MovieSearchResult = {
  id: number;
  title: string;
  releaseDate: string | null;
  posterPath: string | null;
};

type MemoriesFeedProps = {
  memories: MemoryFeedItem[];
  userId: string;
  partnerId: string;
  partnerName: string;
};

const momentTypes: { id: MomentType; label: string; icon: typeof Sparkles }[] = [
  { id: "memory", label: "Воспоминание", icon: Sparkles },
  { id: "movie", label: "Фильм", icon: Clapperboard },
  { id: "cooking", label: "Кулинария", icon: ChefHat },
  { id: "photo", label: "Фото", icon: Camera },
];

export function MemoriesFeed({ memories, userId, partnerId, partnerName }: MemoriesFeedProps) {
  const [dateFilter, setDateFilter] = useState("");
  const [showCreate, setShowCreate] = useState(false);
  const [momentType, setMomentType] = useState<MomentType>("memory");
  const [caption, setCaption] = useState("");
  const [happenedOn, setHappenedOn] = useState("");
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [mediaFile, setMediaFile] = useState<File | null>(null);
  const [movieQuery, setMovieQuery] = useState("");
  const [movieResults, setMovieResults] = useState<MovieSearchResult[]>([]);
  const [selectedMovie, setSelectedMovie] = useState<MovieSearchResult | null>(null);
  const [rating, setRating] = useState(8);
  const [error, setError] = useState("");
  const [isPending, startTransition] = useTransition();

  const filtered = useMemo(() => {
    if (!dateFilter) {
      return memories;
    }
    return memories.filter(
      (memory) => (memory.happened_on ?? memory.created_at.slice(0, 10)) === dateFilter,
    );
  }, [dateFilter, memories]);

  async function searchMovies(query: string) {
    setMovieQuery(query);
    if (query.trim().length < 2) {
      setMovieResults([]);
      return;
    }

    const response = await fetch(`/api/movies/search?q=${encodeURIComponent(query.trim())}`);
    const payload = (await response.json()) as { results?: MovieSearchResult[] };
    setMovieResults(payload.results ?? []);
  }

  function handleFilePick(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) {
      return;
    }

    if (previewUrl) {
      URL.revokeObjectURL(previewUrl);
    }

    setMediaFile(file);
    setPreviewUrl(URL.createObjectURL(file));
  }

  function resetCreateForm() {
    setShowCreate(false);
    setMomentType("memory");
    setCaption("");
    setHappenedOn("");
    setMovieQuery("");
    setMovieResults([]);
    setSelectedMovie(null);
    setRating(8);
    setError("");
    if (previewUrl) {
      URL.revokeObjectURL(previewUrl);
    }
    setPreviewUrl(null);
    setMediaFile(null);
  }

  function handleCreate(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");

    const meta: MomentMeta = {
      caption,
      ratings: { [userId]: rating },
    };

    if (momentType === "movie" && selectedMovie) {
      meta.movieId = selectedMovie.id;
      meta.movieTitle = selectedMovie.title;
      meta.posterPath = selectedMovie.posterPath;
    }

    const formData = new FormData();
    formData.set("momentType", momentType);
    formData.set("body", caption);
    formData.set("happenedOn", happenedOn || new Date().toISOString().slice(0, 10));
    formData.set("meta", JSON.stringify(meta));

    if (momentType === "movie" && selectedMovie) {
      formData.set("title", selectedMovie.title);
    }

    if (mediaFile) {
      formData.set("mediaFile", mediaFile);
    }

    startTransition(async () => {
      const result = await createMoment(formData);
      if (!result.ok) {
        setError(result.error ?? "Не удалось создать момент.");
        return;
      }
      resetCreateForm();
    });
  }

  function handleRate(memoryId: string, value: number) {
    startTransition(async () => {
      const result = await rateMoment(memoryId, value);
      if (!result.ok) {
        setError(result.error ?? "Не удалось сохранить рейтинг.");
      }
    });
  }

  return (
    <>
      <div className="mt-4 flex items-center gap-2">
        <input
          className="flex-1 rounded-2xl surface-input px-4 py-3 text-sm"
          onChange={(event) => setDateFilter(event.target.value)}
          type="date"
          value={dateFilter}
        />
        {dateFilter ? (
          <button
            className="rounded-2xl surface-input px-3 py-3 text-sm font-semibold"
            onClick={() => setDateFilter("")}
            type="button"
          >
            Сброс
          </button>
        ) : null}
      </div>

      <section className="mt-6 grid gap-4">
        {filtered.length ? (
          filtered.map((memory) => {
            const meta = memory.meta ?? {};
            const myRating = meta.ratings?.[userId];
            const partnerRating = meta.ratings?.[partnerId];

            return (
              <article className="overflow-hidden rounded-3xl surface-panel shadow-sm" key={memory.id}>
                {memory.media_url ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    alt=""
                    className="aspect-square w-full object-cover"
                    src={memory.media_url}
                  />
                ) : meta.posterPath ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    alt=""
                    className="aspect-[2/3] w-full object-cover"
                    src={`https://image.tmdb.org/t/p/w500${meta.posterPath}`}
                  />
                ) : null}

                <div className="p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      {memory.title ? (
                        <h2 className="text-lg font-bold">{memory.title}</h2>
                      ) : null}
                      {memory.body ? (
                        <p className="mt-1 leading-7 text-[var(--muted)]">{memory.body}</p>
                      ) : null}
                      <p className="mt-2 text-xs text-[var(--muted)]">
                        {formatDateRu(memory.happened_on ?? memory.created_at.slice(0, 10))} ·{" "}
                        {memory.author_name}
                      </p>
                    </div>
                    <form action={deleteMemory.bind(null, memory.id)}>
                      <button
                        aria-label="Удалить"
                        className="grid size-9 place-items-center rounded-full text-[var(--muted)]"
                        type="submit"
                      >
                        <Trash2 aria-hidden className="size-4" />
                      </button>
                    </form>
                  </div>

                  {memory.moment_type === "movie" || memory.moment_type === "cooking" ? (
                    <div className="mt-4 rounded-2xl bg-[var(--input-bg)] p-3">
                      <p className="text-xs font-semibold uppercase tracking-wide text-[var(--muted)]">
                        Оценки
                      </p>
                      <div className="mt-2 grid gap-2 text-sm">
                        <p>
                          Вы: {myRating ?? "—"}
                          <span className="ml-2 inline-flex gap-1">
                            {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((value) => (
                              <button
                                className={`grid size-6 place-items-center rounded-full text-xs ${
                                  myRating === value
                                    ? "bg-[var(--accent)] text-white"
                                    : "surface-input"
                                }`}
                                key={value}
                                onClick={() => handleRate(memory.id, value)}
                                type="button"
                              >
                                {value}
                              </button>
                            ))}
                          </span>
                        </p>
                        <p>
                          {partnerName}: {partnerRating ?? "—"}
                          {partnerRating ? (
                            <Star
                              aria-hidden
                              className="ml-1 inline size-4 text-[var(--accent)]"
                              fill="currentColor"
                            />
                          ) : null}
                        </p>
                      </div>
                    </div>
                  ) : null}
                </div>
              </article>
            );
          })
        ) : (
          <EmptyState
            description="Создайте первый момент — фото, фильм или воспоминание."
            title="Лента пуста"
          />
        )}
      </section>

      <button
        aria-label="Новый момент"
        className="fixed bottom-[calc(max(0.75rem,env(safe-area-inset-bottom))+5.25rem)] right-5 z-30 grid size-14 place-items-center rounded-full bg-[var(--accent)] text-white shadow-lg transition-transform active:scale-95"
        onClick={() => setShowCreate(true)}
        type="button"
      >
        <Plus aria-hidden className="size-7" strokeWidth={2.2} />
      </button>

      {showCreate ? (
        <div className="fixed inset-0 z-50 flex items-end bg-black/40 p-4 pb-[calc(max(0.75rem,env(safe-area-inset-bottom))+5rem)]">
          <form
            className="max-h-[85dvh] w-full max-w-md overflow-y-auto rounded-3xl surface-panel p-5 shadow-xl"
            onSubmit={handleCreate}
          >
            <div className="mb-4 flex items-center justify-between">
              <p className="text-lg font-bold">Новый момент</p>
              <button
                aria-label="Закрыть"
                className="grid size-9 place-items-center rounded-full surface-input"
                onClick={resetCreateForm}
                type="button"
              >
                <X aria-hidden className="size-5" />
              </button>
            </div>

            <div className="grid grid-cols-2 gap-2">
              {momentTypes.map((type) => {
                const Icon = type.icon;
                const active = momentType === type.id;
                return (
                  <button
                    className={`flex items-center gap-2 rounded-2xl px-3 py-3 text-sm font-semibold ${
                      active ? "bg-[var(--accent-soft)] text-[var(--accent)]" : "surface-input"
                    }`}
                    key={type.id}
                    onClick={() => setMomentType(type.id)}
                    type="button"
                  >
                    <Icon aria-hidden className="size-4" />
                    {type.label}
                  </button>
                );
              })}
            </div>

            {momentType === "movie" ? (
              <div className="mt-4 grid gap-2">
                <input
                  className="rounded-2xl surface-input px-4 py-3"
                  onChange={(event) => void searchMovies(event.target.value)}
                  placeholder="Поиск фильма"
                  value={movieQuery}
                />
                {movieResults.length ? (
                  <ul className="max-h-40 overflow-y-auto rounded-2xl surface-input p-2">
                    {movieResults.map((movie) => (
                      <li key={movie.id}>
                        <button
                          className={`w-full rounded-xl px-3 py-2 text-left text-sm ${
                            selectedMovie?.id === movie.id ? "bg-[var(--accent-soft)]" : ""
                          }`}
                          onClick={() => setSelectedMovie(movie)}
                          type="button"
                        >
                          {movie.title}
                          {movie.releaseDate ? (
                            <span className="text-[var(--muted)]"> ({movie.releaseDate.slice(0, 4)})</span>
                          ) : null}
                        </button>
                      </li>
                    ))}
                  </ul>
                ) : null}
              </div>
            ) : null}

            <div className="mt-4 grid gap-3">
              <label className="grid gap-2">
                <span className="text-sm font-semibold">Фото</span>
                <input
                  accept="image/*"
                  capture="environment"
                  className="rounded-2xl surface-input px-4 py-3 text-sm"
                  onChange={handleFilePick}
                  type="file"
                />
              </label>

              {previewUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  alt=""
                  className="aspect-square w-full rounded-2xl object-cover"
                  src={previewUrl}
                />
              ) : null}

              <textarea
                className="min-h-24 rounded-2xl surface-input px-4 py-3"
                onChange={(event) => setCaption(event.target.value)}
                placeholder={
                  momentType === "cooking"
                    ? "Что приготовили?"
                    : momentType === "movie"
                      ? "Впечатления о фильме"
                      : "Описание"
                }
                value={caption}
              />

              <input
                className="rounded-2xl surface-input px-4 py-3"
                onChange={(event) => setHappenedOn(event.target.value)}
                type="date"
                value={happenedOn}
              />

              {momentType === "movie" || momentType === "cooking" ? (
                <label className="grid gap-2">
                  <span className="text-sm font-semibold">Ваша оценка: {rating}</span>
                  <input
                    className="accent-[var(--accent)]"
                    max={10}
                    min={1}
                    onChange={(event) => setRating(Number(event.target.value))}
                    type="range"
                    value={rating}
                  />
                </label>
              ) : null}

              {error ? <p className="alert-error rounded-xl px-3 py-2 text-sm">{error}</p> : null}

              <button
                className="rounded-2xl bg-[var(--accent)] px-4 py-3 font-semibold text-white disabled:opacity-60"
                disabled={isPending}
                type="submit"
              >
                {isPending ? "Публикуем..." : "Опубликовать"}
              </button>
            </div>
          </form>
        </div>
      ) : null}
    </>
  );
}
