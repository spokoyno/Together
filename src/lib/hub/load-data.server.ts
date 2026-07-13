import "server-only";

import { redirect } from "next/navigation";
import { requireUser } from "@/lib/auth/session";
import { getCoupleContextForUser } from "@/lib/couple/context.server";
import { buildComplimentState } from "@/lib/hub/compliment-state.server";
import { signMediaPaths } from "@/lib/media/actions";
import type {
  HubComment,
  HubComplimentState,
  HubCookingDish,
  HubCookingLog,
  HubMemory,
  HubMovie,
} from "@/components/features/hub/types";
import type { SupabaseClient } from "@supabase/supabase-js";

export type HubContext = {
  supabase: SupabaseClient;
  userId: string;
  coupleId: string;
  partnerId: string;
  partnerName: string;
};

export type HubMenuCounts = {
  moments: number;
  movies: number;
  cooking: number;
  compliments: number;
};

export async function requireHubContext(): Promise<HubContext> {
  const { supabase, user } = await requireUser();
  const context = await getCoupleContextForUser(user.id);

  if (!context?.isComplete || !context.partner) {
    redirect("/dashboard");
  }

  return {
    supabase,
    userId: user.id,
    coupleId: context.coupleId,
    partnerId: context.partner.id,
    partnerName: context.partner.display_name,
  };
}

export async function loadHubMenuCounts(ctx: HubContext): Promise<HubMenuCounts> {
  const [moments, movies, cooking, compliments] = await Promise.all([
    ctx.supabase
      .from("memories")
      .select("id", { count: "exact", head: true })
      .eq("couple_id", ctx.coupleId)
      .in("moment_type", ["memory", "photo"]),
    ctx.supabase
      .from("movie_entries")
      .select("id", { count: "exact", head: true })
      .eq("couple_id", ctx.coupleId),
    ctx.supabase
      .from("cooking_dishes")
      .select("id", { count: "exact", head: true })
      .eq("couple_id", ctx.coupleId)
      .eq("status", "planned"),
    ctx.supabase
      .from("compliments")
      .select("id", { count: "exact", head: true })
      .eq("couple_id", ctx.coupleId)
      .eq("target_user_id", ctx.userId),
  ]);

  return {
    moments: moments.count ?? 0,
    movies: movies.count ?? 0,
    cooking: cooking.count ?? 0,
    compliments: compliments.count ?? 0,
  };
}

async function loadProfileMap(supabase: SupabaseClient, userIds: string[]) {
  if (!userIds.length) {
    return new Map<string, string>();
  }
  const { data } = await supabase.from("profiles").select("id, display_name").in("id", userIds);
  return new Map((data ?? []).map((profile) => [profile.id, profile.display_name]));
}

export async function loadHubMemories(ctx: HubContext): Promise<HubMemory[]> {
  const [memoryRows, commentRows] = await Promise.all([
    ctx.supabase
      .from("memories")
      .select("id, title, body, happened_on, media_path, created_at, created_by, moment_type")
      .eq("couple_id", ctx.coupleId)
      .in("moment_type", ["memory", "photo"])
      .order("created_at", { ascending: false }),
    ctx.supabase
      .from("moment_comments")
      .select("id, memory_id, body, created_at, author_id")
      .order("created_at", { ascending: true }),
  ]);

  const authorIds = [
    ...new Set((memoryRows.data ?? []).map((row) => row.created_by)),
    ...new Set((commentRows.data ?? []).map((row) => row.author_id)),
  ];
  const profileMap = await loadProfileMap(ctx.supabase, authorIds);

  const memoryIds = new Set((memoryRows.data ?? []).map((row) => row.id));
  const commentsByMemory = new Map<string, HubComment[]>();

  for (const row of commentRows.data ?? []) {
    if (!memoryIds.has(row.memory_id)) {
      continue;
    }
    const list = commentsByMemory.get(row.memory_id) ?? [];
    list.push({
      id: row.id,
      body: row.body,
      created_at: row.created_at,
      author_name: profileMap.get(row.author_id) ?? "Пользователь",
    });
    commentsByMemory.set(row.memory_id, list);
  }

  const mediaPaths =
    memoryRows.data?.map((row) => row.media_path).filter((path): path is string => Boolean(path)) ??
    [];
  const signedUrls = await signMediaPaths(ctx.supabase, mediaPaths);

  return (
    memoryRows.data?.map((row) => ({
      id: row.id,
      title: row.title,
      body: row.body,
      happened_on: row.happened_on,
      media_url: row.media_path ? signedUrls[row.media_path] ?? null : null,
      created_at: row.created_at,
      author_name: profileMap.get(row.created_by) ?? "Пользователь",
      comments: commentsByMemory.get(row.id) ?? [],
    })) ?? []
  );
}

export async function loadHubMovies(ctx: HubContext): Promise<HubMovie[]> {
  const { data: movieRows } = await ctx.supabase
    .from("movie_entries")
    .select("id, tmdb_id, title, poster_path, ratings, added_by, created_at")
    .eq("couple_id", ctx.coupleId)
    .order("created_at", { ascending: false });

  return (
    movieRows?.map((row) => ({
      id: row.id,
      tmdb_id: row.tmdb_id,
      title: row.title,
      poster_url: row.poster_path ? `https://image.tmdb.org/t/p/w342${row.poster_path}` : null,
      ratings: (row.ratings ?? {}) as Record<string, number>,
      added_by: row.added_by,
    })) ?? []
  );
}

export async function loadHubCooking(ctx: HubContext): Promise<HubCookingDish[]> {
  const [dishRows, logRows] = await Promise.all([
    ctx.supabase
      .from("cooking_dishes")
      .select("id, title, recipe, media_path, status, cooked_at, created_at, created_by")
      .eq("couple_id", ctx.coupleId)
      .order("created_at", { ascending: false }),
    ctx.supabase
      .from("cooking_logs")
      .select("id, dish_id, body, media_path, created_at, author_id")
      .order("created_at", { ascending: false }),
  ]);

  const authorIds = [
    ...new Set((dishRows.data ?? []).map((row) => row.created_by)),
    ...new Set((logRows.data ?? []).map((row) => row.author_id)),
  ];
  const profileMap = await loadProfileMap(ctx.supabase, authorIds);

  const mediaPaths = [
    ...(dishRows.data ?? []).map((row) => row.media_path),
    ...(logRows.data ?? []).map((row) => row.media_path),
  ].filter((path): path is string => Boolean(path));
  const signedUrls = await signMediaPaths(ctx.supabase, mediaPaths);

  const logsByDish = new Map<string, HubCookingLog[]>();
  for (const row of logRows.data ?? []) {
    const list = logsByDish.get(row.dish_id) ?? [];
    list.push({
      id: row.id,
      body: row.body,
      media_url: row.media_path ? signedUrls[row.media_path] ?? null : null,
      created_at: row.created_at,
      author_name: profileMap.get(row.author_id) ?? "Пользователь",
    });
    logsByDish.set(row.dish_id, list);
  }

  return (
    dishRows.data?.map((row) => ({
      id: row.id,
      title: row.title,
      recipe: row.recipe,
      media_url: row.media_path ? signedUrls[row.media_path] ?? null : null,
      status: row.status as "planned" | "cooked",
      cooked_at: row.cooked_at,
      created_at: row.created_at,
      author_name: profileMap.get(row.created_by) ?? "Пользователь",
      logs: logsByDish.get(row.id) ?? [],
    })) ?? []
  );
}

export async function loadHubComplimentState(ctx: HubContext): Promise<HubComplimentState> {
  const [partnerCompliments, myCompliments, drawState] = await Promise.all([
    ctx.supabase
      .from("compliments")
      .select("id", { count: "exact", head: true })
      .eq("couple_id", ctx.coupleId)
      .eq("target_user_id", ctx.partnerId)
      .eq("author_id", ctx.userId),
    ctx.supabase
      .from("compliments")
      .select("id", { count: "exact", head: true })
      .eq("couple_id", ctx.coupleId)
      .eq("target_user_id", ctx.userId),
    ctx.supabase
      .from("compliment_draw_state")
      .select("last_draw_at")
      .eq("user_id", ctx.userId)
      .maybeSingle(),
  ]);

  return buildComplimentState({
    partnerJarCount: partnerCompliments.count ?? 0,
    myJarCount: myCompliments.count ?? 0,
    lastDrawAt: drawState.data?.last_draw_at ?? null,
  });
}
