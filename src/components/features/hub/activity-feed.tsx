"use client";

import Link from "next/link";
import { formatDateLocalized } from "@/lib/dates";
import type { ActivityFeedItem } from "@/lib/hub/activity-feed.server";
import { EmptyState } from "@/components/ui/empty-state";
import { useLanguage } from "@/components/providers/language-provider";
import type { MessageKey } from "@/lib/i18n/messages";

const KIND_KEYS: Record<ActivityFeedItem["kind"], MessageKey> = {
  memory: "feedKindMemory",
  movie_watched: "feedKindMovie",
  cooking: "feedKindCooking",
  wish_fulfilled: "feedKindWishlist",
  tier_completed: "feedKindTier",
  book_read: "feedKindBook",
  poll_completed: "feedKindPoll",
};

function feedSubtitle(item: ActivityFeedItem, t: (key: MessageKey, params?: Record<string, string | number>) => string) {
  if (item.kind === "memory") {
    return item.subtitle;
  }
  if (item.kind === "book_read") {
    return item.meta?.book_author
      ? t("feedActivityBookAuthor", { author: item.meta.book_author })
      : t("feedActivityBook");
  }
  if (item.kind === "poll_completed") {
    if (item.meta?.poll_correct != null && item.meta?.poll_total != null) {
      return t("feedActivityPollScore", {
        correct: item.meta.poll_correct,
        total: item.meta.poll_total,
      });
    }
    return t("feedActivityPollDone");
  }

  const subtitleKeys: Partial<Record<ActivityFeedItem["kind"], MessageKey>> = {
    movie_watched: "feedActivityMovie",
    cooking: "feedActivityCooking",
    wish_fulfilled: "feedActivityWish",
    tier_completed: "feedActivityTier",
  };

  const key = subtitleKeys[item.kind];
  return key ? t(key) : item.subtitle;
}

type ActivityFeedProps = {
  items: ActivityFeedItem[];
};

export function ActivityFeed({ items }: ActivityFeedProps) {
  const { locale, t } = useLanguage();

  return (
    <>
      <header>
        <h1 className="text-2xl font-semibold">{t("feedTitle")}</h1>
        <p className="mt-1 text-sm text-[var(--muted)]">{t("feedSubtitle")}</p>
      </header>

      {items.length ? (
        <section className="mt-6 grid gap-2.5">
          {items.map((item) => (
            <article className="rounded-[1.35rem] surface-panel p-4" key={item.id}>
              <div className="flex gap-3">
                {item.media_url ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img alt="" className="size-14 shrink-0 rounded-2xl object-cover" src={item.media_url} />
                ) : (
                  <div className="grid size-14 shrink-0 place-items-center rounded-2xl bg-[var(--input-bg)] text-lg">
                    {item.kind === "book_read" ? "📚" : item.kind === "movie_watched" ? "🎬" : item.kind === "poll_completed" ? "📋" : "✨"}
                  </div>
                )}
                <div className="min-w-0 flex-1">
                  <div className="flex items-start justify-between gap-2">
                    <p className="text-[11px] font-medium uppercase tracking-wide text-[var(--accent)]">
                      {t(KIND_KEYS[item.kind])}
                    </p>
                    <time className="shrink-0 text-xs text-[var(--muted)]">
                      {formatDateLocalized(locale, item.happened_at.slice(0, 10))}
                    </time>
                  </div>
                  <h2 className="mt-1 font-semibold leading-snug">
                    {item.title || (item.kind === "memory" ? t("feedDefaultMoment") : item.title)}
                  </h2>
                  {feedSubtitle(item, t) ? (
                    <p className="mt-1 line-clamp-2 text-sm text-[var(--muted)]">{feedSubtitle(item, t)}</p>
                  ) : null}
                  <p className="mt-2 text-xs text-[var(--muted)]">
                    {item.actor_name || t("defaultPartner")}
                  </p>
                  {item.link_path ? (
                    <Link
                      className="mt-2 inline-block text-sm font-medium text-[var(--accent)]"
                      href={item.link_path}
                    >
                      {t("commonOpen")}
                    </Link>
                  ) : null}
                </div>
              </div>
            </article>
          ))}
        </section>
      ) : (
        <div className="mt-8">
          <EmptyState description={t("feedEmptyHint")} title={t("feedEmpty")} />
        </div>
      )}
    </>
  );
}
