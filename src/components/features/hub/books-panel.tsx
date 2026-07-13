"use client";

import { BookOpen, Plus, X } from "lucide-react";
import { useRouter } from "next/navigation";
import { useMemo, useState, useTransition } from "react";
import { EmptyState } from "@/components/ui/empty-state";
import { RatingDisplay, RatingInput } from "@/components/ui/rating-stars";
import type { HubBook } from "@/components/features/hub/types";
import { addBookToWantList, markBookRead, saveBookReview } from "@/lib/books/actions";

type BooksPanelProps = {
  books: HubBook[];
  userId: string;
  partnerId: string;
  partnerName: string;
};

type BooksTab = "want" | "read";

type ReadModalState = {
  bookId: string;
  title: string;
  rating: number;
  review: string;
};

function sortReadBooks(books: HubBook[], userId: string, partnerId: string) {
  return [...books].sort((a, b) => {
    const aMissing = !a.ratings[userId] || !a.ratings[partnerId];
    const bMissing = !b.ratings[userId] || !b.ratings[partnerId];
    if (aMissing !== bMissing) {
      return aMissing ? -1 : 1;
    }
    return 0;
  });
}

function BookCover({ size = "card" }: { size?: "card" | "thumb" }) {
  const cardClass = size === "card" ? "size-28 shrink-0 rounded-2xl" : "size-12 shrink-0 rounded-xl";

  return (
    <div
      className={`grid ${cardClass} place-items-center bg-[var(--accent-soft)] text-[var(--accent)] ${size === "card" ? "text-2xl" : "text-base"}`}
    >
      <BookOpen aria-hidden className={size === "card" ? "size-10" : "size-5"} />
    </div>
  );
}

export function BooksPanel({ books, userId, partnerId, partnerName }: BooksPanelProps) {
  const [tab, setTab] = useState<BooksTab>("want");
  const [showForm, setShowForm] = useState(false);
  const [title, setTitle] = useState("");
  const [author, setAuthor] = useState("");
  const [readModal, setReadModal] = useState<ReadModalState | null>(null);
  const [reviewDrafts, setReviewDrafts] = useState<Record<string, string>>({});
  const [error, setError] = useState("");
  const [isPending, startTransition] = useTransition();
  const router = useRouter();

  const wantBooks = useMemo(() => books.filter((book) => book.status === "want"), [books]);
  const readBooks = useMemo(
    () => sortReadBooks(
      books.filter((book) => book.status === "read"),
      userId,
      partnerId,
    ),
    [books, userId, partnerId],
  );

  function resetForm() {
    setShowForm(false);
    setTitle("");
    setAuthor("");
    setError("");
  }

  function submitBook(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");

    startTransition(async () => {
      const result = await addBookToWantList({
        title,
        author: author.trim() || undefined,
      });

      if (!result.ok) {
        setError(result.error ?? "Не удалось добавить книгу.");
        return;
      }

      resetForm();
      router.refresh();
    });
  }

  function openReadModal(book: HubBook) {
    setReadModal({
      bookId: book.id,
      title: book.title,
      rating: book.ratings[userId] ?? 8,
      review: book.reviews[userId] ?? "",
    });
  }

  function submitReadModal(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!readModal) {
      return;
    }

    setError("");
    startTransition(async () => {
      const result = await markBookRead(readModal.bookId, readModal.rating, readModal.review);
      if (!result.ok) {
        setError(result.error ?? "Не удалось сохранить.");
        return;
      }
      setReadModal(null);
      router.refresh();
    });
  }

  function saveReview(bookId: string) {
    const review = reviewDrafts[bookId] ?? "";
    startTransition(async () => {
      const result = await saveBookReview(bookId, review);
      if (!result.ok) {
        setError(result.error ?? "Не удалось сохранить отзыв.");
        return;
      }
      router.refresh();
    });
  }

  return (
    <>
      <div className="mb-4 flex gap-2 overflow-x-auto">
        {(
          [
            ["want", "Хочу прочитать"],
            ["read", "Прочитано"],
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

      {tab === "want" ? (
        <section className="grid gap-4">
          {wantBooks.length ? (
            wantBooks.map((book) => (
              <article className="overflow-hidden rounded-3xl surface-panel" key={book.id}>
                <div className="flex gap-4 p-4">
                  <BookCover />
                  <div className="min-w-0 flex-1">
                    <h2 className="font-bold leading-snug">{book.title}</h2>
                    {book.author ? (
                      <p className="mt-1 text-sm text-[var(--muted)]">{book.author}</p>
                    ) : null}
                    <div className="mt-3">
                      <button
                        className="rounded-xl bg-[var(--accent)] px-3 py-2.5 text-xs font-semibold text-white disabled:opacity-60"
                        disabled={isPending}
                        onClick={() => openReadModal(book)}
                        type="button"
                      >
                        Прочитано
                      </button>
                    </div>
                  </div>
                </div>
              </article>
            ))
          ) : (
            <EmptyState
              description="Добавьте книгу, которую хотите прочитать вместе."
              title="Список книг пуст"
            />
          )}
        </section>
      ) : (
        <section className="grid gap-4">
          {readBooks.length ? (
            readBooks.map((book) => {
              const myRating = book.ratings[userId];
              const partnerRating = book.ratings[partnerId];
              const myReview = book.reviews[userId];
              const partnerReview = book.reviews[partnerId];

              return (
                <article className="overflow-hidden rounded-3xl surface-panel" key={book.id}>
                  <div className="flex gap-4 p-4">
                    <BookCover />
                    <div className="min-w-0 flex-1">
                      <h2 className="font-bold leading-snug">{book.title}</h2>
                      {book.author ? (
                        <p className="mt-1 text-sm text-[var(--muted)]">{book.author}</p>
                      ) : null}
                      <div className="mt-3 space-y-2">
                        <RatingDisplay label="Вы" value={myRating} />
                        <RatingDisplay label={partnerName} value={partnerRating} />
                      </div>
                    </div>
                  </div>

                  <div className="space-y-2 border-t border-[var(--border)] px-4 py-4">
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
                          [book.id]: event.target.value,
                        }))
                      }
                      placeholder="Ваш отзыв после прочтения…"
                      value={reviewDrafts[book.id] ?? myReview ?? ""}
                    />
                    <button
                      className="rounded-xl bg-[var(--accent)] px-3 py-2.5 text-xs font-semibold text-white disabled:opacity-60"
                      disabled={isPending}
                      onClick={() => saveReview(book.id)}
                      type="button"
                    >
                      Сохранить отзыв
                    </button>
                  </div>
                </article>
              );
            })
          ) : (
            <EmptyState
              description="Отметьте книгу прочитанной и оставьте отзыв."
              title="Прочитанных книг пока нет"
            />
          )}
        </section>
      )}

      {tab === "want" ? (
        <button
          aria-label="Добавить книгу"
          className="fixed bottom-[calc(max(0.75rem,env(safe-area-inset-bottom))+5.25rem)] right-5 z-30 grid size-14 place-items-center rounded-full bg-[var(--accent)] text-white shadow-lg active:scale-95"
          onClick={() => setShowForm(true)}
          type="button"
        >
          <Plus aria-hidden className="size-7" strokeWidth={2.2} />
        </button>
      ) : null}

      {readModal ? (
        <div className="fixed inset-0 z-50 flex items-end bg-black/40 p-4 pb-[calc(max(0.75rem,env(safe-area-inset-bottom))+5rem)]">
          <form className="w-full max-w-md rounded-3xl surface-panel p-5 shadow-xl" onSubmit={submitReadModal}>
            <div className="mb-4 flex items-center justify-between">
              <p className="text-lg font-bold">Прочитано</p>
              <button
                aria-label="Закрыть"
                className="grid size-9 place-items-center rounded-full surface-input"
                onClick={() => setReadModal(null)}
                type="button"
              >
                <X aria-hidden className="size-5" />
              </button>
            </div>
            <p className="mb-3 font-semibold">{readModal.title}</p>
            <p className="mb-2 text-sm font-semibold">Оценка</p>
            <RatingInput
              disabled={isPending}
              onChange={(rating) => setReadModal((current) => (current ? { ...current, rating } : current))}
              value={readModal.rating}
            />
            <label className="mt-4 block text-sm font-semibold" htmlFor="read-review">
              Отзыв
            </label>
            <textarea
              className="mt-2 min-h-24 w-full rounded-2xl surface-input px-4 py-3 text-sm"
              id="read-review"
              onChange={(event) =>
                setReadModal((current) => (current ? { ...current, review: event.target.value } : current))
              }
              placeholder="Что понравилось или не понравилось?"
              value={readModal.review}
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

      {showForm ? (
        <div className="fixed inset-0 z-50 flex items-end bg-black/40 p-4 pb-[calc(max(0.75rem,env(safe-area-inset-bottom))+5rem)]">
          <form className="max-h-[85vh] w-full overflow-y-auto rounded-3xl surface-panel p-5 shadow-xl" onSubmit={submitBook}>
            <div className="mb-4 flex items-center justify-between">
              <p className="text-lg font-bold">Добавить книгу</p>
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
