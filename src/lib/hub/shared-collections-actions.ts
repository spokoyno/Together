"use server";

import { revalidatePath } from "next/cache";
import { addBookToWantList } from "@/lib/books/actions";
import { getAuthContext } from "@/lib/couple/context.server";
import { addMovieEntry } from "@/lib/hub/actions";
import { addCatalogEntry } from "@/lib/hub/catalog-actions";
import type { CatalogKind } from "@/lib/hub/catalog";
import { actionError } from "@/lib/validation/forms";

export type SharedCollectionKind = "movie" | "game" | "tv_series" | "cartoon_series" | "anime" | "book";
export type SharedCollectionSort = "new" | "popular" | "liked";

export type SharedCollectionItemInput = {
  externalId?: string | null;
  title: string;
  posterPath?: string | null;
  subtitle?: string | null;
};

export type SharedCollectionRow = {
  id: string;
  kind: SharedCollectionKind;
  title: string;
  description: string | null;
  author_id: string;
  author_name: string;
  view_count: number;
  like_count: number;
  created_at: string;
  liked_by_me: boolean;
  items: Array<{
    id: string;
    external_id: string | null;
    title: string;
    poster_path: string | null;
    subtitle: string | null;
    sort_order: number;
  }>;
};

const KIND_PATHS: Record<SharedCollectionKind, string> = {
  movie: "/memories/movies",
  game: "/memories/games",
  tv_series: "/memories/series",
  cartoon_series: "/memories/cartoons",
  anime: "/memories/anime",
  book: "/memories/books",
};

export async function fetchSharedCollections(
  kind: SharedCollectionKind,
  sort: SharedCollectionSort,
  query?: string,
): Promise<SharedCollectionRow[]> {
  const { supabase, user } = await getAuthContext();

  let builder = supabase
    .from("shared_collections")
    .select("id, kind, title, description, author_id, view_count, like_count, created_at")
    .eq("kind", kind);

  const trimmedQuery = query?.trim();
  if (trimmedQuery) {
    builder = builder.ilike("title", `%${trimmedQuery}%`);
  }

  if (sort === "new") {
    builder = builder.order("created_at", { ascending: false });
  } else if (sort === "popular") {
    builder = builder.order("view_count", { ascending: false }).order("created_at", { ascending: false });
  } else {
    builder = builder.order("like_count", { ascending: false }).order("created_at", { ascending: false });
  }

  const { data: rows, error } = await builder.limit(40);
  if (error || !rows?.length) {
    return [];
  }

  const collectionIds = rows.map((row) => row.id);
  const authorIds = [...new Set(rows.map((row) => row.author_id))];

  const [{ data: items }, { data: likes }, { data: profiles }] = await Promise.all([
    supabase
      .from("shared_collection_items")
      .select("id, collection_id, external_id, title, poster_path, subtitle, sort_order")
      .in("collection_id", collectionIds)
      .order("sort_order", { ascending: true }),
    supabase
      .from("shared_collection_likes")
      .select("collection_id")
      .eq("user_id", user.id)
      .in("collection_id", collectionIds),
    supabase.from("profiles").select("id, display_name").in("id", authorIds),
  ]);

  const likedSet = new Set((likes ?? []).map((row) => row.collection_id));
  const profileMap = new Map((profiles ?? []).map((row) => [row.id, row.display_name]));
  const itemsByCollection = new Map<string, NonNullable<typeof items>>();

  for (const item of items ?? []) {
    const list = itemsByCollection.get(item.collection_id) ?? [];
    list.push(item);
    itemsByCollection.set(item.collection_id, list);
  }

  return rows.map((row) => ({
    id: row.id,
    kind: row.kind as SharedCollectionKind,
    title: row.title,
    description: row.description,
    author_id: row.author_id,
    author_name: profileMap.get(row.author_id) ?? "User",
    view_count: row.view_count,
    like_count: row.like_count,
    created_at: row.created_at,
    liked_by_me: likedSet.has(row.id),
    items: itemsByCollection.get(row.id) ?? [],
  }));
}

export async function createSharedCollection(
  kind: SharedCollectionKind,
  title: string,
  description: string,
  items: SharedCollectionItemInput[],
) {
  const { supabase, user } = await getAuthContext();

  const trimmedTitle = title.trim();
  if (!trimmedTitle) {
    return actionError("COLLECTION_TITLE_REQUIRED");
  }

  const validItems = items.filter((item) => item.title.trim());
  if (!validItems.length) {
    return actionError("COLLECTION_ITEMS_REQUIRED");
  }

  const { data: collection, error } = await supabase
    .from("shared_collections")
    .insert({
      kind,
      title: trimmedTitle,
      description: description.trim() || null,
      author_id: user.id,
    })
    .select("id")
    .single();

  if (error || !collection) {
    return actionError("COLLECTION_CREATE_FAILED");
  }

  for (const [index, item] of validItems.entries()) {
    const { error: itemError } = await supabase.from("shared_collection_items").insert({
      collection_id: collection.id,
      external_id: item.externalId ?? null,
      title: item.title.trim(),
      poster_path: item.posterPath ?? null,
      subtitle: item.subtitle ?? null,
      sort_order: index,
    });

    if (itemError) {
      return actionError("COLLECTION_CREATE_FAILED");
    }
  }

  revalidatePath(KIND_PATHS[kind]);
  return { ok: true as const, id: collection.id };
}

export async function toggleSharedCollectionLike(collectionId: string, kind: SharedCollectionKind) {
  const { supabase, user } = await getAuthContext();

  const { data: existing } = await supabase
    .from("shared_collection_likes")
    .select("collection_id")
    .eq("collection_id", collectionId)
    .eq("user_id", user.id)
    .maybeSingle();

  if (existing) {
    await supabase
      .from("shared_collection_likes")
      .delete()
      .eq("collection_id", collectionId)
      .eq("user_id", user.id);
  } else {
    await supabase.from("shared_collection_likes").insert({
      collection_id: collectionId,
      user_id: user.id,
    });
  }

  revalidatePath(KIND_PATHS[kind]);
  return { ok: true as const, liked: !existing };
}

export async function recordSharedCollectionView(collectionId: string) {
  const { supabase } = await getAuthContext();
  await supabase.rpc("record_shared_collection_view", { p_collection_id: collectionId });
  return { ok: true as const };
}

export async function deleteSharedCollection(collectionId: string, kind: SharedCollectionKind) {
  const { supabase, user } = await getAuthContext();
  const { isAppAdmin } = await import("@/lib/admin/server");

  if (!(await isAppAdmin(user.id))) {
    return actionError("NOT_ADMIN");
  }

  const { error } = await supabase.from("shared_collections").delete().eq("id", collectionId);

  if (error) {
    return actionError("COLLECTION_DELETE_FAILED");
  }

  revalidatePath(KIND_PATHS[kind]);
  return { ok: true as const };
}

function normalizeTmdbPosterPath(path: string | null): string | null {
  if (!path) {
    return null;
  }
  if (path.startsWith("http")) {
    const match = path.match(/\/t\/p\/w\d+(\/.+)$/);
    return match?.[1] ?? null;
  }
  return path.startsWith("/") ? path : `/${path}`;
}

function normalizePosterUrl(path: string | null): string | null {
  if (!path) {
    return null;
  }
  if (path.startsWith("http")) {
    return path;
  }
  return `https://image.tmdb.org/t/p/w342${path.startsWith("/") ? path : `/${path}`}`;
}

export async function addSharedCollectionItemToWantList(
  kind: SharedCollectionKind,
  item: {
    externalId: string | null;
    title: string;
    posterPath: string | null;
    subtitle: string | null;
  },
) {
  const trimmedTitle = item.title.trim();
  if (!trimmedTitle) {
    return actionError("COLLECTION_ITEM_INVALID");
  }

  if (kind === "movie") {
    if (!item.externalId) {
      return actionError("COLLECTION_ITEM_NO_ID");
    }
    return addMovieEntry({
      tmdbId: Number(item.externalId),
      title: trimmedTitle,
      posterPath: normalizeTmdbPosterPath(item.posterPath),
      rating: 8,
    });
  }

  if (kind === "book") {
    return addBookToWantList({
      title: trimmedTitle,
      author: item.subtitle?.trim() || undefined,
    });
  }

  const catalogKind = kind as CatalogKind;
  if (!item.externalId) {
    return actionError("COLLECTION_ITEM_NO_ID");
  }

  return addCatalogEntry({
    kind: catalogKind,
    externalId: Number(item.externalId),
    title: trimmedTitle,
    posterUrl: normalizePosterUrl(item.posterPath),
    rating: 8,
  });
}
