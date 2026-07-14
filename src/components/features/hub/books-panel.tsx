"use client";

import { BookOpen, Plus, X } from "lucide-react";
import { useRouter } from "next/navigation";
import { useMemo, useState, useTransition } from "react";
import { useLanguage } from "@/components/providers/language-provider";
import { EmptyState } from "@/components/ui/empty-state";
import { RatingDisplay, RatingInput } from "@/components/ui/rating-stars";
import type { HubBook } from "@/components/features/hub/types";
import { addBookToWantList, markBookRead, saveBookReview, updateBookRating } from "@/lib/books/actions";
import { SharedCollectionsPanel } from "@/components/features/hub/shared-collections-panel";
import { ModalSheet } from "@/components/ui/modal-sheet";

type BooksPanelProps = {
  books: HubBook[];
  userId: string;
  partnerId: string;
  partnerName: string;
};

type BooksTab = "want" | "read" | "community";

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
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<
    { id: string; title: string; author: string | null; coverUrl: string | null }[]
  >([]);
  const [title, setTitle] = useState("");
  const [author, setAuthor] = useState("");
  const [readModal, setReadModal] = useState<ReadModalState | null>(null);
  const [reviewDrafts, setReviewDrafts] = useState<Record<string, string>>({});
  const [ratingDrafts, setRatingDrafts] = useState<Record<string, number>>({});
  const [error, setError] = useState("");
  const [isPending, startTransition] = useTransition();
  const router = useRouter();
  const { t } = useLanguage();

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
    setSearchQuery("");
    setSearchResults([]);
    setTitle("");
    setAuthor("");
    setError("");
  }

  async function searchBooks(value: string) {
    setSearchQuery(value);
    if (value.trim().length < 2) {
      setSearchResults([]);
      return;
    }

    const response = await fetch(`/api/books/search?q=${encodeURIComponent(value.trim())}`);
    const payload = (await response.json()) as {
      results?: { id: string; title: string; author: string | null; coverUrl: string | null }[];
    };
    setSearchResults(payload.results ?? []);
  }

  function pickBook(result: { title: string; author: string | null }) {
    setTitle(result.title);
    setAuthor(result.author ?? "");
    setSearchResults([]);
    setSearchQuery("");
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
        setError(result.error ?? t("hubBooksErrorAdd"));
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
        setError(result.error ?? t("hubErrorSave"));
        return;
      }
      setReadModal(null);
      router.refresh();
    });
  }

  function saveFeedback(bookId: string) {
    const review = reviewDrafts[bookId] ?? "";
    const book = readBooks.find((row) => row.id === bookId);
    const rating = ratingDrafts[bookId] ?? book?.ratings[userId] ?? 8;

    startTransition(async () => {
      const ratingResult = await updateBookRating(bookId, rating);
      if (!ratingResult.ok) {
        setError(ratingResult.error ?? t("hubBooksErrorReview"));
        return;
      }
      const result = await saveBookReview(bookId, review);
      if (!result.ok) {
        setError(result.error ?? t("hubBooksErrorReview"));
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
            ["want", t("hubBooksWantRead")],
            ["read", t("hubBooksRead")],
            ["community", t("sharedCollectionsTab")],
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

      {tab === "community" ? (
        <SharedCollectionsPanel kind="book" searchPath="/api/books/search" />
      ) : null}

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
                        {t("hubBooksMarkRead")}
                      </button>
                    </div>
                  </div>
                </div>
              </article>
            ))
          ) : (
            <EmptyState
              description={t("hubBooksEmptyWantDesc")}
              title={t("hubBooksEmptyWant")}
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
                        <div>
                          <p className="mb-1 text-xs text-[var(--muted)]">{t("commonYou")}</p>
                          <RatingInput
                            onChange={(value) =>
                              setRatingDrafts((current) => ({ ...current, [book.id]: value }))
                            }
                            value={ratingDrafts[book.id] ?? myRating ?? 8}
                          />
                        </div>
                        <RatingDisplay label={partnerName} value={partnerRating} />
                      </div>
                    </div>
                  </div>

                  <div className="space-y-2 border-t border-[var(--border)] px-4 py-4">
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
                      placeholder={t("hubReviewShort")}
                      value={reviewDrafts[book.id] ?? myReview ?? ""}
                    />
                    <button
                      className="rounded-xl bg-[var(--accent)] px-3 py-2.5 text-xs font-semibold text-white disabled:opacity-60"
                      disabled={isPending}
                      onClick={() => saveFeedback(book.id)}
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
              description={t("hubBooksEmptyReadDesc")}
              title={t("hubBooksEmptyRead")}
            />
          )}
        </section>
      )}

      {tab === "want" ? (
        <button
          aria-label={t("hubBooksAddBook")}
          className="fixed bottom-[calc(max(0.75rem,env(safe-area-inset-bottom))+5.25rem)] right-5 z-30 grid size-14 place-items-center rounded-full bg-[var(--accent)] text-white shadow-lg active:scale-95"
          onClick={() => setShowForm(true)}
          type="button"
        >
          <Plus aria-hidden className="size-7" strokeWidth={2.2} />
        </button>
      ) : null}

      {readModal ? (
        <ModalSheet as="form" onClose={() => setReadModal(null)} onSubmit={submitReadModal} open>
            <div className="mb-4 flex items-center justify-between">
              <p className="text-lg font-bold">{t("hubBooksReadTitle")}</p>
              <button
                aria-label={t("commonClose")}
                className="grid size-9 place-items-center rounded-full surface-input"
                onClick={() => setReadModal(null)}
                type="button"
              >
                <X aria-hidden className="size-5" />
              </button>
            </div>
            <p className="mb-3 font-semibold">{readModal.title}</p>
            <p className="mb-2 text-sm font-semibold">{t("ratingLabel")}</p>
            <RatingInput
              disabled={isPending}
              onChange={(rating) => setReadModal((current) => (current ? { ...current, rating } : current))}
              value={readModal.rating}
            />
            <label className="mt-4 block text-sm font-semibold" htmlFor="read-review">
              {t("commonReview")}
            </label>
            <textarea
              className="mt-2 min-h-24 w-full rounded-2xl surface-input px-4 py-3 text-sm"
              id="read-review"
              onChange={(event) =>
                setReadModal((current) => (current ? { ...current, review: event.target.value } : current))
              }
              placeholder={t("hubReviewPlaceholder")}
              value={readModal.review}
            />
            <button
              className="mt-4 w-full rounded-2xl bg-[var(--accent)] py-3 font-semibold text-white disabled:opacity-60"
              disabled={isPending}
              type="submit"
            >
              {isPending ? t("commonSaving") : t("commonSave")}
            </button>
        </ModalSheet>
      ) : null}

      {showForm ? (
        <ModalSheet as="form" onClose={resetForm} onSubmit={submitBook} open>
            <div className="mb-4 flex items-center justify-between">
              <p className="text-lg font-bold">{t("hubBooksAddBook")}</p>
              <button
                aria-label={t("commonClose")}
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
                onChange={(event) => void searchBooks(event.target.value)}
                placeholder={t("hubBooksSearchPlaceholder")}
                value={searchQuery}
              />
              {searchResults.length ? (
                <div className="max-h-48 space-y-2 overflow-y-auto">
                  {searchResults.map((result) => (
                    <button
                      className="flex w-full items-center gap-3 rounded-xl surface-input px-3 py-2 text-left"
                      key={result.id}
                      onClick={() => pickBook(result)}
                      type="button"
                    >
                      {result.coverUrl ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img alt="" className="size-10 rounded-lg object-cover" src={result.coverUrl} />
                      ) : (
                        <BookCover size="thumb" />
                      )}
                      <span className="min-w-0">
                        <span className="block truncate text-sm font-semibold">{result.title}</span>
                        {result.author ? (
                          <span className="block truncate text-xs text-[var(--muted)]">{result.author}</span>
                        ) : null}
                      </span>
                    </button>
                  ))}
                </div>
              ) : searchQuery.trim().length >= 2 ? (
                <p className="text-center text-sm text-[var(--muted)]">{t("hubBooksSearchEmpty")}</p>
              ) : null}

              <input
                className="rounded-2xl surface-input px-4 py-3"
                onChange={(event) => setTitle(event.target.value)}
                placeholder={t("commonTitle")}
                required
                value={title}
              />
              <input
                className="rounded-2xl surface-input px-4 py-3"
                onChange={(event) => setAuthor(event.target.value)}
                placeholder={t("hubBooksAuthorOptional")}
                value={author}
              />

              <button
                className="rounded-2xl bg-[var(--accent)] py-3 font-semibold text-white disabled:opacity-60"
                disabled={!title.trim() || isPending}
                type="submit"
              >
                {isPending ? t("commonSaving") : t("commonAdd")}
              </button>
            </div>
        </ModalSheet>
      ) : null}
    </>
  );
}
