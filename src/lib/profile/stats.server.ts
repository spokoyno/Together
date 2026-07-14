import "server-only";

import type { SupabaseClient } from "@supabase/supabase-js";

export type CoupleStats = {
  feed: number;
  movies: number;
  games: number;
  tvSeries: number;
  cartoons: number;
  anime: number;
  books: number;
  dishes: number;
  compliments: number;
  wishes: number;
  chatPhotos: number;
  adventures: number;
};

async function countExact(
  supabase: SupabaseClient,
  table: string,
  coupleId: string,
  filters?: Record<string, string>,
) {
  let query = supabase.from(table).select("id", { count: "exact", head: true }).eq("couple_id", coupleId);
  for (const [key, value] of Object.entries(filters ?? {})) {
    query = query.eq(key, value);
  }
  const { count } = await query;
  return count ?? 0;
}

export async function loadCoupleStats(
  supabase: SupabaseClient,
  coupleId: string,
): Promise<CoupleStats> {
  const [
    memories,
    movies,
    games,
    tvSeries,
    cartoons,
    anime,
    books,
    dishes,
    compliments,
    wishes,
    chatPhotos,
    adventures,
  ] = await Promise.all([
    countExact(supabase, "memories", coupleId),
    countExact(supabase, "movie_entries", coupleId, { status: "watched" }),
    countExact(supabase, "catalog_entries", coupleId, { kind: "game", status: "completed" }),
    countExact(supabase, "catalog_entries", coupleId, { kind: "tv_series", status: "completed" }),
    countExact(supabase, "catalog_entries", coupleId, { kind: "cartoon_series", status: "completed" }),
    countExact(supabase, "catalog_entries", coupleId, { kind: "anime", status: "completed" }),
    countExact(supabase, "book_entries", coupleId, { status: "read" }),
    countExact(supabase, "cooking_dishes", coupleId, { status: "cooked" }),
    countExact(supabase, "compliments", coupleId),
    countExact(supabase, "wishlist_items", coupleId, { status: "fulfilled" }),
    supabase
      .from("messages")
      .select("id", { count: "exact", head: true })
      .eq("couple_id", coupleId)
      .not("image_path", "is", null)
      .then(({ count }) => count ?? 0),
    countExact(supabase, "travel_plans", coupleId, { status: "completed" }),
  ]);

  const feed = memories;

  return {
    feed,
    movies,
    games,
    tvSeries,
    cartoons,
    anime,
    books,
    dishes,
    compliments,
    wishes,
    chatPhotos,
    adventures,
  };
}
