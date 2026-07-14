import "server-only";

import { signMediaPaths } from "@/lib/media/actions";
import type { HubContext } from "@/lib/hub/load-data.server";

export type ActivityFeedItem = {
  id: string;
  kind:
    | "memory"
    | "movie_watched"
    | "cooking"
    | "wish_fulfilled"
    | "tier_completed"
    | "book_read"
    | "poll_completed";
  title: string;
  subtitle: string | null;
  actor_name: string;
  media_url: string | null;
  link_path: string | null;
  happened_at: string;
  meta?: {
    book_author?: string | null;
    poll_correct?: number;
    poll_total?: number;
  };
};

export async function loadActivityFeed(ctx: HubContext): Promise<ActivityFeedItem[]> {
  const [memories, movies, cooking, wishes, tiers, books, polls] = await Promise.all([
    ctx.supabase
      .from("memories")
      .select("id, title, body, media_path, created_at, created_by, moment_type")
      .eq("couple_id", ctx.coupleId)
      .in("moment_type", ["memory", "photo"])
      .order("created_at", { ascending: false })
      .limit(30),
    ctx.supabase
      .from("movie_entries")
      .select("id, title, poster_path, watched_at, created_at, added_by, status")
      .eq("couple_id", ctx.coupleId)
      .eq("status", "watched")
      .order("watched_at", { ascending: false, nullsFirst: false })
      .limit(30),
    ctx.supabase
      .from("cooking_dishes")
      .select("id, title, media_path, cooked_at, created_at, created_by, status")
      .eq("couple_id", ctx.coupleId)
      .eq("status", "cooked")
      .order("cooked_at", { ascending: false, nullsFirst: false })
      .limit(30),
    ctx.supabase
      .from("wishlist_items")
      .select("id, title, media_path, fulfilled_at, created_at, created_by, fulfilled_by")
      .eq("couple_id", ctx.coupleId)
      .eq("status", "fulfilled")
      .order("fulfilled_at", { ascending: false, nullsFirst: false })
      .limit(30),
    ctx.supabase
      .from("tier_list_challenges")
      .select("id, tier_list_title, result_image_path, completed_at, created_at, target_user_id")
      .eq("couple_id", ctx.coupleId)
      .eq("status", "completed")
      .order("completed_at", { ascending: false, nullsFirst: false })
      .limit(30),
    ctx.supabase
      .from("book_entries")
      .select("id, title, author, read_at, created_at, added_by")
      .eq("couple_id", ctx.coupleId)
      .eq("status", "read")
      .order("read_at", { ascending: false, nullsFirst: false })
      .limit(30),
    ctx.supabase
      .from("partner_polls")
      .select("id, title, completed_at, created_at, target_user_id, score_correct, score_total")
      .eq("couple_id", ctx.coupleId)
      .eq("status", "completed")
      .order("completed_at", { ascending: false, nullsFirst: false })
      .limit(30),
  ]);

  const userIds = [
    ...(memories.data ?? []).map((row) => row.created_by),
    ...(movies.data ?? []).map((row) => row.added_by),
    ...(cooking.data ?? []).map((row) => row.created_by),
    ...(wishes.data ?? []).flatMap((row) => [row.created_by, row.fulfilled_by].filter(Boolean) as string[]),
    ...(tiers.data ?? []).map((row) => row.target_user_id),
    ...(books.data ?? []).map((row) => row.added_by),
    ...(polls.data ?? []).map((row) => row.target_user_id),
  ];

  const uniqueUserIds = [...new Set(userIds)];
  const { data: profileRows } = uniqueUserIds.length
    ? await ctx.supabase.from("profiles").select("id, display_name").in("id", uniqueUserIds)
    : { data: [] as { id: string; display_name: string }[] };

  const nameMap = new Map((profileRows ?? []).map((row) => [row.id, row.display_name]));

  const mediaPaths = [
    ...(memories.data ?? []).map((row) => row.media_path),
    ...(cooking.data ?? []).map((row) => row.media_path),
    ...(wishes.data ?? []).map((row) => row.media_path),
    ...(tiers.data ?? []).map((row) => row.result_image_path),
  ].filter((path): path is string => Boolean(path));

  const signed = await signMediaPaths(ctx.supabase, mediaPaths);
  const items: ActivityFeedItem[] = [];

  for (const row of memories.data ?? []) {
    items.push({
      id: `memory-${row.id}`,
      kind: "memory",
      title: row.title ?? "",
      subtitle: row.body,
      actor_name: nameMap.get(row.created_by) ?? "",
      media_url: row.media_path ? signed[row.media_path] ?? null : null,
      link_path: "/memories/moments",
      happened_at: row.created_at,
    });
  }

  for (const row of movies.data ?? []) {
    items.push({
      id: `movie-${row.id}`,
      kind: "movie_watched",
      title: row.title,
      subtitle: null,
      actor_name: nameMap.get(row.added_by) ?? "",
      media_url: row.poster_path ? `https://image.tmdb.org/t/p/w342${row.poster_path}` : null,
      link_path: "/memories/movies",
      happened_at: row.watched_at ?? row.created_at,
    });
  }

  for (const row of cooking.data ?? []) {
    items.push({
      id: `cooking-${row.id}`,
      kind: "cooking",
      title: row.title,
      subtitle: null,
      actor_name: nameMap.get(row.created_by) ?? "",
      media_url: row.media_path ? signed[row.media_path] ?? null : null,
      link_path: "/memories/cooking",
      happened_at: row.cooked_at ?? row.created_at,
    });
  }

  for (const row of wishes.data ?? []) {
    const actorId = row.fulfilled_by ?? row.created_by;
    items.push({
      id: `wish-${row.id}`,
      kind: "wish_fulfilled",
      title: row.title,
      subtitle: null,
      actor_name: nameMap.get(actorId) ?? "",
      media_url: row.media_path ? signed[row.media_path] ?? null : null,
      link_path: "/memories/wishlist",
      happened_at: row.fulfilled_at ?? row.created_at,
    });
  }

  for (const row of tiers.data ?? []) {
    items.push({
      id: `tier-${row.id}`,
      kind: "tier_completed",
      title: row.tier_list_title,
      subtitle: null,
      actor_name: nameMap.get(row.target_user_id) ?? "",
      media_url: row.result_image_path ? signed[row.result_image_path] ?? null : null,
      link_path: "/memories/tiers",
      happened_at: row.completed_at ?? row.created_at,
    });
  }

  for (const row of books.data ?? []) {
    items.push({
      id: `book-${row.id}`,
      kind: "book_read",
      title: row.title,
      subtitle: null,
      actor_name: nameMap.get(row.added_by) ?? "",
      media_url: null,
      link_path: "/memories/books",
      happened_at: row.read_at ?? row.created_at,
      meta: { book_author: row.author },
    });
  }

  for (const row of polls.data ?? []) {
    items.push({
      id: `poll-${row.id}`,
      kind: "poll_completed",
      title: row.title,
      subtitle: null,
      actor_name: nameMap.get(row.target_user_id) ?? "",
      media_url: null,
      link_path: "/memories/polls",
      happened_at: row.completed_at ?? row.created_at,
      meta:
        row.score_total != null && row.score_correct != null
          ? { poll_correct: row.score_correct, poll_total: row.score_total }
          : undefined,
    });
  }

  return items.sort((a, b) => b.happened_at.localeCompare(a.happened_at)).slice(0, 40);
}
