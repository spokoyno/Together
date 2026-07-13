"use client";

import Link from "next/link";
import { formatDateRu } from "@/lib/dates";
import type { ActivityFeedItem } from "@/lib/hub/activity-feed.server";
import { EmptyState } from "@/components/ui/empty-state";

const KIND_LABELS: Record<ActivityFeedItem["kind"], string> = {
  memory: "Момент",
  movie_watched: "Фильм",
  cooking: "Готовка",
  wish_fulfilled: "Wishlist",
  tier_completed: "Тир-лист",
  book_read: "Книга",
};

type ActivityFeedProps = {
  items: ActivityFeedItem[];
};

export function ActivityFeed({ items }: ActivityFeedProps) {
  return (
    <>
      <header>
        <h1 className="text-2xl font-bold">Лента</h1>
        <p className="mt-1 text-sm text-[var(--muted)]">Всё, что вы сделали вместе</p>
      </header>

      {items.length ? (
        <section className="mt-6 grid gap-3">
          {items.map((item) => (
            <article className="rounded-3xl surface-panel p-4" key={item.id}>
              <div className="flex gap-3">
                {item.media_url ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img alt="" className="size-16 shrink-0 rounded-2xl object-cover" src={item.media_url} />
                ) : (
                  <div className="grid size-16 shrink-0 place-items-center rounded-2xl bg-[var(--input-bg)] text-xl">
                    {item.kind === "book_read" ? "📚" : item.kind === "movie_watched" ? "🎬" : "✨"}
                  </div>
                )}
                <div className="min-w-0 flex-1">
                  <div className="flex items-start justify-between gap-2">
                    <p className="text-xs font-semibold uppercase tracking-wide text-[var(--accent)]">
                      {KIND_LABELS[item.kind]}
                    </p>
                    <time className="shrink-0 text-xs text-[var(--muted)]">
                      {formatDateRu(item.happened_at.slice(0, 10))}
                    </time>
                  </div>
                  <h2 className="mt-1 font-bold leading-snug">{item.title}</h2>
                  {item.subtitle ? (
                    <p className="mt-1 line-clamp-2 text-sm text-[var(--muted)]">{item.subtitle}</p>
                  ) : null}
                  <p className="mt-2 text-xs text-[var(--muted)]">{item.actor_name}</p>
                  {item.link_path ? (
                    <Link className="mt-2 inline-block text-sm font-semibold text-[var(--accent)]" href={item.link_path}>
                      Открыть
                    </Link>
                  ) : null}
                </div>
              </div>
            </article>
          ))}
        </section>
      ) : (
        <div className="mt-8">
          <EmptyState
            description="Здесь появятся фильмы, фото, готовка, желания и тир-листы."
            title="Лента пока пуста"
          />
        </div>
      )}
    </>
  );
}
