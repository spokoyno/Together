"use client";

import { BookOpen, Plus, X } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { EmptyState } from "@/components/ui/empty-state";
import { RatingDisplay, RatingInput } from "@/components/ui/rating-stars";
import type { HubBook } from "@/components/features/hub/types";
import { addBookEntry } from "@/lib/books/actions";
import { formatDateRu } from "@/lib/dates";

type BooksPanelProps = {
  books: HubBook[];
};

export function BooksPanel({ books }: BooksPanelProps) {
  const [showForm, setShowForm] = useState(false);
  const [title, setTitle] = useState("");
  const [author, setAuthor] = useState("");
  const [hasRating, setHasRating] = useState(false);
  const [rating, setRating] = useState(8);
  const [review, setReview] = useState("");
  const [error, setError] = useState("");
  const [isPending, startTransition] = useTransition();
  const router = useRouter();

  function resetForm() {
    setShowForm(false);
    setTitle("");
    setAuthor("");
    setHasRating(false);
    setRating(8);
    setReview("");
    setError("");
  }

  function submitBook(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");

    startTransition(async () => {
      const result = await addBookEntry({
        title,
        author: author.trim() || undefined,
        rating: hasRating ? rating : undefined,
        review: review.trim() || undefined,
      });

      if (!result.ok) {
        setError(result.error ?? "Не удалось сохранить книгу.");
        return;
      }

      resetForm();
      router.refresh();
    });
  }

  return (
    <>
      <section className="grid gap-3">
        {books.length ? (
          books.map((book) => (
            <article className="rounded-3xl surface-panel p-4" key={book.id}>
              <div className="flex items-start gap-3">
                <div className="grid size-12 shrink-0 place-items-center rounded-2xl bg-[var(--accent-soft)] text-[var(--accent)]">
                  <BookOpen aria-hidden className="size-6" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="font-bold leading-snug">{book.title}</p>
                  {book.author ? (
                    <p className="mt-1 text-sm text-[var(--muted)]">{book.author}</p>
                  ) : null}
                  <p className="mt-1 text-xs text-[var(--muted)]">
                    {book.author_name} · {formatDateRu(book.created_at)}
                  </p>
                  {book.rating ? (
                    <div className="mt-2">
                      <RatingDisplay value={book.rating} />
                    </div>
                  ) : null}
                  {book.review ? (
                    <p className="mt-2 rounded-xl surface-input px-3 py-2 text-sm">{book.review}</p>
                  ) : null}
                </div>
              </div>
            </article>
          ))
        ) : (
          <EmptyState
            description="Добавьте книгу, которую прочитали или хотите обсудить."
            title="Книг пока нет"
          />
        )}
      </section>

      <button
        aria-label="Добавить книгу"
        className="fixed bottom-[calc(max(0.75rem,env(safe-area-inset-bottom))+5.25rem)] right-5 z-30 grid size-14 place-items-center rounded-full bg-[var(--accent)] text-white shadow-lg active:scale-95"
        onClick={() => setShowForm(true)}
        type="button"
      >
        <Plus aria-hidden className="size-7" strokeWidth={2.2} />
      </button>

      {showForm ? (
        <div className="fixed inset-0 z-50 flex items-end bg-black/40 p-4 pb-[calc(max(0.75rem,env(safe-area-inset-bottom))+5rem)]">
          <form className="max-h-[85vh] w-full overflow-y-auto rounded-3xl surface-panel p-5 shadow-xl" onSubmit={submitBook}>
            <div className="mb-4 flex items-center justify-between">
              <p className="text-lg font-bold">Новая книга</p>
              <button
                aria-label="Закрыть"
                className="grid size-9 place-items-center rounded-full surface-input"
                onClick={resetForm}
                type="button"
              >
                <X aria-hidden className="size-5" />
              </button>
            </div>

            <div className="grid gap-3">
              <input
                className="rounded-2xl surface-input px-4 py-3"
                onChange={(event) => setTitle(event.target.value)}
                placeholder="Название"
                required
                value={title}
              />
              <input
                className="rounded-2xl surface-input px-4 py-3"
                onChange={(event) => setAuthor(event.target.value)}
                placeholder="Автор (необязательно)"
                value={author}
              />

              <label className="flex min-h-11 items-center gap-3 rounded-2xl surface-input px-4 py-2.5 text-sm font-medium">
                <input
                  checked={hasRating}
                  className="size-4 accent-[var(--accent)]"
                  onChange={(event) => setHasRating(event.target.checked)}
                  type="checkbox"
                />
                Поставить оценку
              </label>

              {hasRating ? (
                <RatingInput disabled={isPending} onChange={setRating} value={rating} />
              ) : null}

              <textarea
                className="min-h-24 rounded-2xl surface-input px-4 py-3 text-sm"
                onChange={(event) => setReview(event.target.value)}
                placeholder="Отзыв (необязательно)"
                value={review}
              />

              {error ? <p className="alert-error rounded-xl px-3 py-2 text-sm">{error}</p> : null}

              <button
                className="rounded-2xl bg-[var(--accent)] py-3 font-semibold text-white disabled:opacity-60"
                disabled={!title.trim() || isPending}
                type="submit"
              >
                {isPending ? "Сохраняем…" : "Добавить"}
              </button>
            </div>
          </form>
        </div>
      ) : null}
    </>
  );
}
