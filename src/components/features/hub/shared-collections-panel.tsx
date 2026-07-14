"use client";

import { Heart, Plus, Search, X } from "lucide-react";
import { useEffect, useState, useTransition } from "react";
import { useLanguage } from "@/components/providers/language-provider";
import { EmptyState } from "@/components/ui/empty-state";
import { ModalSheet } from "@/components/ui/modal-sheet";
import {
  createSharedCollection,
  fetchSharedCollections,
  recordSharedCollectionView,
  toggleSharedCollectionLike,
  type SharedCollectionKind,
  type SharedCollectionRow,
  type SharedCollectionSort,
} from "@/lib/hub/shared-collections-actions";
import { formatDateLocalized } from "@/lib/dates";

type SharedCollectionsPanelProps = {
  kind: SharedCollectionKind;
  searchPath: string;
};

type DraftItem = {
  externalId: string | null;
  title: string;
  posterPath: string | null;
  subtitle: string | null;
};

type SearchHit = {
  id: string;
  title: string;
  posterUrl: string | null;
  subtitle: string | null;
};

function posterSrc(kind: SharedCollectionKind, path: string | null) {
  if (!path) {
    return null;
  }
  if (path.startsWith("http")) {
    return path;
  }
  if (kind === "movie" || kind === "tv_series" || kind === "cartoon_series" || kind === "anime") {
    return `https://image.tmdb.org/t/p/w342${path}`;
  }
  return path;
}

const KIND_EMOJI: Record<SharedCollectionKind, string> = {
  movie: "🎬",
  game: "🎮",
  tv_series: "📺",
  cartoon_series: "🎨",
  anime: "✨",
  book: "📚",
};

export function SharedCollectionsPanel({ kind, searchPath }: SharedCollectionsPanelProps) {
  const { locale, t } = useLanguage();
  const [sort, setSort] = useState<SharedCollectionSort>("new");
  const [query, setQuery] = useState("");
  const [collections, setCollections] = useState<SharedCollectionRow[]>([]);
  const [detailId, setDetailId] = useState<string | null>(null);
  const [showCreate, setShowCreate] = useState(false);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [draftItems, setDraftItems] = useState<DraftItem[]>([]);
  const [itemQuery, setItemQuery] = useState("");
  const [itemResults, setItemResults] = useState<SearchHit[]>([]);
  const [error, setError] = useState("");
  const [isPending, startTransition] = useTransition();

  const detail = collections.find((row) => row.id === detailId) ?? null;

  function reloadCollections(nextSort = sort, nextQuery = query) {
    startTransition(async () => {
      const rows = await fetchSharedCollections(kind, nextSort, nextQuery);
      setCollections(rows);
    });
  }

  useEffect(() => {
    reloadCollections();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [kind]);

  async function searchItems(value: string) {
    setItemQuery(value);
    if (value.trim().length < 2) {
      setItemResults([]);
      return;
    }

    const response = await fetch(`${searchPath}?q=${encodeURIComponent(value.trim())}`);
    const payload = (await response.json()) as {
      results?: Array<Record<string, unknown>>;
      error?: string;
    };

    if (payload.error) {
      setError(t("sharedCollectionsSearchError"));
    }

    const mapped = (payload.results ?? []).map((row) => {
      if (kind === "book") {
        return {
          id: String(row.id ?? ""),
          title: String(row.title ?? ""),
          posterUrl: typeof row.coverUrl === "string" ? row.coverUrl : null,
          subtitle: typeof row.author === "string" ? row.author : null,
        };
      }

      const year = row.year ?? row.first_air_date;
      return {
        id: String(row.id ?? ""),
        title: String(row.title ?? ""),
        posterUrl:
          typeof row.posterUrl === "string"
            ? row.posterUrl
            : typeof row.posterPath === "string"
              ? row.posterPath
              : null,
        subtitle: year ? String(year) : null,
      };
    });

    setItemResults(mapped.filter((row) => row.title && row.id));
  }

  function addDraftItem(item: SearchHit) {
    setDraftItems((current) => {
      if (current.some((row) => row.externalId === item.id && row.title === item.title)) {
        return current;
      }
      return [
        ...current,
        {
          externalId: item.id,
          title: item.title,
          posterPath: item.posterUrl,
          subtitle: item.subtitle,
        },
      ];
    });
    setItemResults([]);
    setItemQuery("");
  }

  function openDetail(collection: SharedCollectionRow) {
    setDetailId(collection.id);
    void recordSharedCollectionView(collection.id);
    setCollections((current) =>
      current.map((row) =>
        row.id === collection.id ? { ...row, view_count: row.view_count + 1 } : row,
      ),
    );
  }

  function submitCreate(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    startTransition(async () => {
      const result = await createSharedCollection(kind, title, description, draftItems);
      if (!result.ok) {
        setError(t("sharedCollectionsCreateError"));
        return;
      }
      setShowCreate(false);
      setTitle("");
      setDescription("");
      setDraftItems([]);
      reloadCollections();
    });
  }

  function toggleLike(collectionId: string) {
    startTransition(async () => {
      const result = await toggleSharedCollectionLike(collectionId, kind);
      if (!result.ok) {
        return;
      }
      setCollections((current) =>
        current.map((row) => {
          if (row.id !== collectionId) {
            return row;
          }
          const liked = !row.liked_by_me;
          return {
            ...row,
            liked_by_me: liked,
            like_count: Math.max(0, row.like_count + (liked ? 1 : -1)),
          };
        }),
      );
    });
  }

  return (
    <>
      <div className="mb-4 flex gap-2 overflow-x-auto">
        {(["new", "popular", "liked"] as const).map((key) => (
          <button
            className={`shrink-0 rounded-2xl px-4 py-2 text-sm font-semibold ${sort === key ? "bg-[var(--accent)] text-white" : "surface-input"}`}
            key={key}
            onClick={() => {
              setSort(key);
              reloadCollections(key, query);
            }}
            type="button"
          >
            {t(key === "new" ? "sharedCollectionsSortNew" : key === "popular" ? "sharedCollectionsSortPopular" : "sharedCollectionsSortLiked")}
          </button>
        ))}
      </div>

      <div className="relative mb-4">
        <Search
          aria-hidden
          className="pointer-events-none absolute left-4 top-1/2 size-4 -translate-y-1/2 text-[var(--muted)]"
        />
        <input
          className="w-full rounded-2xl surface-input py-3 pl-11 pr-4 text-sm"
          onChange={(event) => setQuery(event.target.value)}
          placeholder={t("sharedCollectionsSearchPlaceholder")}
          value={query}
        />
        <button
          className="mt-2 w-full rounded-2xl surface-input py-2.5 text-sm font-semibold"
          onClick={() => reloadCollections(sort, query)}
          type="button"
        >
          {t("sharedCollectionsApplySearch")}
        </button>
      </div>

      {collections.length ? (
        <div className="grid gap-2">
          {collections.map((collection) => (
            <article className="rounded-2xl surface-panel p-4" key={collection.id}>
              <button
                className="w-full text-left"
                onClick={() => openDetail(collection)}
                type="button"
              >
                <p className="font-semibold">{collection.title}</p>
                {collection.description ? (
                  <p className="mt-1 line-clamp-2 text-sm text-[var(--muted)]">{collection.description}</p>
                ) : null}
                <p className="mt-2 text-xs text-[var(--muted)]">
                  {collection.author_name} · {collection.items.length}{" "}
                  {t("sharedCollectionsItems")} · {formatDateLocalized(locale, collection.created_at.slice(0, 10))}
                </p>
              </button>
              <div className="mt-3 flex items-center gap-4 text-xs text-[var(--muted)]">
                <span>{t("sharedCollectionsViews", { count: collection.view_count })}</span>
                <button
                  className={`inline-flex min-h-9 items-center gap-1 rounded-xl px-2 py-1 font-semibold ${collection.liked_by_me ? "text-[var(--accent)]" : ""}`}
                  onClick={() => toggleLike(collection.id)}
                  type="button"
                >
                  <Heart
                    aria-hidden
                    className={`size-4 ${collection.liked_by_me ? "fill-current" : ""}`}
                  />
                  {collection.like_count}
                </button>
              </div>
            </article>
          ))}
        </div>
      ) : (
        <EmptyState
          description={t("sharedCollectionsEmptyDesc")}
          title={t("sharedCollectionsEmpty")}
        />
      )}

      <button
        aria-label={t("sharedCollectionsCreate")}
        className="fixed bottom-[calc(max(0.75rem,env(safe-area-inset-bottom))+5.25rem)] right-5 z-30 grid size-14 place-items-center rounded-full bg-[var(--accent)] text-white shadow-lg active:scale-95"
        onClick={() => setShowCreate(true)}
        type="button"
      >
        <Plus aria-hidden className="size-7" />
      </button>

      {showCreate ? (
        <ModalSheet as="form" className="max-h-[90vh]" onClose={() => setShowCreate(false)} onSubmit={submitCreate} open>
            <div className="mb-4 flex items-center justify-between">
              <p className="text-lg font-bold">{t("sharedCollectionsCreate")}</p>
              <button
                aria-label={t("commonClose")}
                className="grid size-9 place-items-center rounded-full surface-input"
                onClick={() => setShowCreate(false)}
                type="button"
              >
                <X aria-hidden className="size-5" />
              </button>
            </div>

            <div className="grid gap-3">
              <input
                className="rounded-2xl surface-input px-4 py-3"
                onChange={(event) => setTitle(event.target.value)}
                placeholder={t("sharedCollectionsTitlePlaceholder")}
                required
                value={title}
              />
              <textarea
                className="min-h-20 rounded-2xl surface-input px-4 py-3 text-sm"
                onChange={(event) => setDescription(event.target.value)}
                placeholder={t("sharedCollectionsDescPlaceholder")}
                value={description}
              />

              <p className="text-sm font-semibold">{t("sharedCollectionsAddItems")}</p>
              <input
                className="rounded-2xl surface-input px-4 py-3 text-sm"
                onChange={(event) => void searchItems(event.target.value)}
                placeholder={t("sharedCollectionsItemSearchPlaceholder")}
                value={itemQuery}
              />
              {itemResults.length ? (
                <div className="grid max-h-40 gap-2 overflow-y-auto">
                  {itemResults.map((item) => (
                    <button
                      className="rounded-xl surface-input px-3 py-2 text-left text-sm"
                      key={`${item.id}-${item.title}`}
                      onClick={() => addDraftItem(item)}
                      type="button"
                    >
                      {item.title}
                      {item.subtitle ? ` · ${item.subtitle}` : ""}
                    </button>
                  ))}
                </div>
              ) : null}

              {draftItems.length ? (
                <ul className="grid gap-2">
                  {draftItems.map((item, index) => (
                    <li className="flex items-center justify-between rounded-xl surface-input px-3 py-2 text-sm" key={`${item.externalId}-${index}`}>
                      <span className="truncate">{item.title}</span>
                      <button
                        aria-label={t("commonRemove")}
                        className="ml-2 text-xs text-[var(--muted)]"
                        onClick={() =>
                          setDraftItems((current) => current.filter((_, i) => i !== index))
                        }
                        type="button"
                      >
                        ×
                      </button>
                    </li>
                  ))}
                </ul>
              ) : null}

              {error ? <p className="alert-error rounded-xl px-3 py-2 text-sm">{error}</p> : null}

              <button
                className="rounded-2xl bg-[var(--accent)] py-3 font-semibold text-white disabled:opacity-60"
                disabled={isPending || !title.trim() || draftItems.length === 0}
                type="submit"
              >
                {isPending ? t("commonSaving") : t("sharedCollectionsPublish")}
              </button>
            </div>
        </ModalSheet>
      ) : null}

      {detail ? (
        <div className="fixed inset-0 z-50 flex items-end bg-black/40 p-4 pb-24">
          <div className="max-h-[90vh] w-full overflow-y-auto rounded-3xl surface-panel p-5">
            <div className="mb-4 flex items-start justify-between gap-3">
              <div>
                <p className="text-lg font-bold">{detail.title}</p>
                <p className="mt-1 text-sm text-[var(--muted)]">{detail.author_name}</p>
              </div>
              <button
                aria-label={t("commonClose")}
                className="grid size-9 shrink-0 place-items-center rounded-full surface-input"
                onClick={() => setDetailId(null)}
                type="button"
              >
                <X aria-hidden className="size-5" />
              </button>
            </div>

            {detail.description ? (
              <p className="mb-4 text-sm text-[var(--muted)]">{detail.description}</p>
            ) : null}

            <div className="mb-4 flex items-center gap-4 text-sm">
              <span className="text-[var(--muted)]">{t("sharedCollectionsViews", { count: detail.view_count })}</span>
              <button
                className={`inline-flex items-center gap-1 font-semibold ${detail.liked_by_me ? "text-[var(--accent)]" : "text-[var(--muted)]"}`}
                onClick={() => toggleLike(detail.id)}
                type="button"
              >
                <Heart aria-hidden className={`size-4 ${detail.liked_by_me ? "fill-current" : ""}`} />
                {detail.like_count}
              </button>
            </div>

            <ul className="grid gap-2">
              {detail.items.map((item) => {
                const src = posterSrc(kind, item.poster_path);
                return (
                  <li className="flex items-center gap-3 rounded-2xl surface-input p-3" key={item.id}>
                    {src ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img alt="" className="size-12 shrink-0 rounded-xl object-cover" src={src} />
                    ) : (
                      <div className="grid size-12 shrink-0 place-items-center rounded-xl bg-[var(--accent-soft)] text-lg">
                        {KIND_EMOJI[kind]}
                      </div>
                    )}
                    <div className="min-w-0">
                      <p className="font-medium">{item.title}</p>
                      {item.subtitle ? (
                        <p className="text-xs text-[var(--muted)]">{item.subtitle}</p>
                      ) : null}
                    </div>
                  </li>
                );
              })}
            </ul>
          </div>
        </div>
      ) : null}
    </>
  );
}
