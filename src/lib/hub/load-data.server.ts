import "server-only";

import { redirect } from "next/navigation";
import { requireUser } from "@/lib/auth/session";
import { getCoupleContextForUser } from "@/lib/couple/context.server";
import { buildComplimentState } from "@/lib/hub/compliment-state.server";
import type { CatalogEntry, CatalogKind } from "@/lib/hub/catalog";
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
  shopping: number;
  wishlist: number;
  tiers: number;
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
  const [moments, movies, cooking, compliments, shopping, wishlist, tiers] = await Promise.all([
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
    ctx.supabase
      .from("shopping_notes")
      .select("id", { count: "exact", head: true })
      .eq("couple_id", ctx.coupleId)
      .eq("status", "open"),
    ctx.supabase
      .from("wishlist_items")
      .select("id", { count: "exact", head: true })
      .eq("couple_id", ctx.coupleId)
      .eq("status", "open"),
    ctx.supabase
      .from("tier_list_challenges")
      .select("id", { count: "exact", head: true })
      .eq("couple_id", ctx.coupleId)
      .eq("target_user_id", ctx.userId)
      .eq("status", "pending"),
  ]);

  return {
    moments: moments.count ?? 0,
    movies: movies.count ?? 0,
    cooking: cooking.count ?? 0,
    compliments: compliments.count ?? 0,
    shopping: shopping.count ?? 0,
    wishlist: wishlist.count ?? 0,
    tiers: tiers.count ?? 0,
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
    .select("id, tmdb_id, title, poster_path, ratings, reviews, added_by, status, created_at")
    .eq("couple_id", ctx.coupleId)
    .order("created_at", { ascending: false });

  return (
    movieRows?.map((row) => ({
      id: row.id,
      tmdb_id: row.tmdb_id,
      title: row.title,
      poster_url: row.poster_path ? `https://image.tmdb.org/t/p/w342${row.poster_path}` : null,
      ratings: (row.ratings ?? {}) as Record<string, number>,
      reviews: (row.reviews ?? {}) as Record<string, string>,
      added_by: row.added_by,
      status: (row.status ?? "want") as "want" | "watched",
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

export async function loadHubShopping(ctx: HubContext) {
  const { data: rows } = await ctx.supabase
    .from("shopping_notes")
    .select("id, body, status, created_by, closed_by, closed_at, created_at")
    .eq("couple_id", ctx.coupleId)
    .order("created_at", { ascending: false });

  const profileMap = await loadProfileMap(ctx.supabase, [
    ...new Set([
      ...(rows ?? []).map((row) => row.created_by),
      ...(rows ?? []).map((row) => row.closed_by).filter(Boolean) as string[],
    ]),
  ]);

  return (
    rows?.map((row) => ({
      id: row.id,
      body: row.body,
      status: row.status as "open" | "closed",
      author_name: profileMap.get(row.created_by) ?? "Пользователь",
      closed_by_name: row.closed_by ? profileMap.get(row.closed_by) ?? null : null,
      closed_at: row.closed_at,
      created_at: row.created_at,
    })) ?? []
  );
}

export async function loadHubWishlist(ctx: HubContext) {
  const { data: rows } = await ctx.supabase
    .from("wishlist_items")
    .select("id, title, description, media_path, status, created_by, fulfilled_by, created_at")
    .eq("couple_id", ctx.coupleId)
    .order("created_at", { ascending: false });

  const profileMap = await loadProfileMap(ctx.supabase, [
    ...new Set([
      ...(rows ?? []).map((row) => row.created_by),
      ...(rows ?? []).map((row) => row.fulfilled_by).filter(Boolean) as string[],
    ]),
  ]);

  const signed = await signMediaPaths(
    ctx.supabase,
    (rows ?? []).map((row) => row.media_path).filter((path): path is string => Boolean(path)),
  );

  return (
    rows?.map((row) => ({
      id: row.id,
      title: row.title,
      description: row.description,
      media_url: row.media_path ? signed[row.media_path] ?? null : null,
      status: row.status as "open" | "fulfilled",
      created_by: row.created_by,
      author_name: profileMap.get(row.created_by) ?? "Пользователь",
      fulfilled_by_name: row.fulfilled_by ? profileMap.get(row.fulfilled_by) ?? null : null,
    })) ?? []
  );
}

export async function loadHubTierChallenges(ctx: HubContext) {
  const { data: rows } = await ctx.supabase
    .from("tier_list_challenges")
    .select("id, tier_list_url, tier_list_title, status, challenger_id, target_user_id, result_image_path, created_at, completed_at")
    .eq("couple_id", ctx.coupleId)
    .order("created_at", { ascending: false });

  const challengeIds = (rows ?? []).map((row) => row.id);
  const { data: commentRows } = challengeIds.length
    ? await ctx.supabase
        .from("tier_list_comments")
        .select("id, challenge_id, body, author_id, created_at")
        .in("challenge_id", challengeIds)
        .order("created_at", { ascending: true })
    : { data: [] as Array<{ id: string; challenge_id: string; body: string; author_id: string; created_at: string }> };

  const profileMap = await loadProfileMap(ctx.supabase, [
    ...(rows ?? []).map((row) => row.challenger_id),
    ...(rows ?? []).map((row) => row.target_user_id),
    ...(commentRows ?? []).map((row) => row.author_id),
  ]);

  const signed = await signMediaPaths(
    ctx.supabase,
    (rows ?? []).map((row) => row.result_image_path).filter((path): path is string => Boolean(path)),
  );

  const commentsByChallenge = new Map<string, typeof commentRows>();
  for (const comment of commentRows ?? []) {
    const list = commentsByChallenge.get(comment.challenge_id) ?? [];
    list.push(comment);
    commentsByChallenge.set(comment.challenge_id, list);
  }

  return (
    rows?.map((row) => ({
      id: row.id,
      tier_list_url: row.tier_list_url,
      tier_list_title: row.tier_list_title,
      status: row.status as "pending" | "completed",
      challenger_name: profileMap.get(row.challenger_id) ?? "Партнёр",
      target_user_id: row.target_user_id,
      result_image_url: row.result_image_path ? signed[row.result_image_path] ?? null : null,
      created_at: row.completed_at ?? row.created_at,
      comments:
        commentsByChallenge.get(row.id)?.map((comment) => ({
          id: comment.id,
          body: comment.body,
          author_name: profileMap.get(comment.author_id) ?? "Пользователь",
          created_at: comment.created_at,
        })) ?? [],
    })) ?? []
  );
}

export async function loadHubBooks(ctx: HubContext) {
  const { data: rows } = await ctx.supabase
    .from("book_entries")
    .select("id, title, author, ratings, reviews, added_by, status, read_at, created_at")
    .eq("couple_id", ctx.coupleId)
    .order("created_at", { ascending: false });

  const profileMap = await loadProfileMap(
    ctx.supabase,
    [...new Set((rows ?? []).map((row) => row.added_by))],
  );

  return (
    rows?.map((row) => ({
      id: row.id,
      title: row.title,
      author: row.author,
      ratings: (row.ratings ?? {}) as Record<string, number>,
      reviews: (row.reviews ?? {}) as Record<string, string>,
      added_by: row.added_by,
      author_name: profileMap.get(row.added_by) ?? "Пользователь",
      status: (row.status ?? "want") as "want" | "read",
      read_at: row.read_at,
      created_at: row.created_at,
    })) ?? []
  );
}

export async function loadHubPolls(ctx: HubContext) {
  const { data: rows } = await ctx.supabase
    .from("partner_polls")
    .select("id, title, status, creator_id, target_user_id, created_at")
    .eq("couple_id", ctx.coupleId)
    .order("created_at", { ascending: false });

  if (!rows?.length) {
    return [];
  }

  const pollIds = rows.map((row) => row.id);
  const { data: questions } = await ctx.supabase
    .from("poll_questions")
    .select("id, poll_id, prompt, allows_text, sort_order")
    .in("poll_id", pollIds)
    .order("sort_order", { ascending: true });

  const questionIds = (questions ?? []).map((row) => row.id);
  const { data: options } = questionIds.length
    ? await ctx.supabase
        .from("poll_options")
        .select("id, question_id, label, sort_order")
        .in("question_id", questionIds)
        .order("sort_order", { ascending: true })
    : { data: [] as Array<{ id: string; question_id: string; label: string; sort_order: number }> };

  const profileMap = await loadProfileMap(
    ctx.supabase,
    [...new Set(rows.map((row) => row.creator_id))],
  );

  const optionsByQuestion = new Map<string, typeof options>();
  for (const option of options ?? []) {
    const list = optionsByQuestion.get(option.question_id) ?? [];
    list.push(option);
    optionsByQuestion.set(option.question_id, list);
  }

  const questionsByPoll = new Map<string, typeof questions>();
  for (const question of questions ?? []) {
    const list = questionsByPoll.get(question.poll_id) ?? [];
    list.push(question);
    questionsByPoll.set(question.poll_id, list);
  }

  return rows.map((row) => ({
    id: row.id,
    title: row.title,
    status: row.status as "pending" | "completed",
    creator_name: profileMap.get(row.creator_id) ?? "Партнёр",
    target_user_id: row.target_user_id,
    created_at: row.created_at,
    questions:
      questionsByPoll.get(row.id)?.map((question) => ({
        id: question.id,
        prompt: question.prompt,
        allows_text: question.allows_text,
        options:
          optionsByQuestion.get(question.id)?.map((option) => ({
            id: option.id,
            label: option.label,
          })) ?? [],
      })) ?? [],
  }));
}

export async function loadPartnerFacts(ctx: HubContext, targetUserId: string) {
  const { data: rows } = await ctx.supabase
    .from("partner_facts")
    .select("id, trait, description, author_id")
    .eq("couple_id", ctx.coupleId)
    .eq("target_user_id", targetUserId)
    .order("created_at", { ascending: false });

  const profileMap = await loadProfileMap(
    ctx.supabase,
    [...new Set((rows ?? []).map((row) => row.author_id))],
  );

  return (
    rows?.map((row) => ({
      id: row.id,
      trait: row.trait,
      description: row.description,
      author_name: profileMap.get(row.author_id) ?? "Пользователь",
    })) ?? []
  );
}

export async function loadCoupleGallery(ctx: HubContext) {
  const { data: rows } = await ctx.supabase
    .from("couple_gallery")
    .select("id, media_path, caption, created_by, created_at")
    .eq("couple_id", ctx.coupleId)
    .order("created_at", { ascending: false });

  const profileMap = await loadProfileMap(
    ctx.supabase,
    [...new Set((rows ?? []).map((row) => row.created_by))],
  );

  const signed = await signMediaPaths(
    ctx.supabase,
    (rows ?? []).map((row) => row.media_path).filter(Boolean),
  );

  return (
    rows?.map((row) => ({
      id: row.id,
      media_url: signed[row.media_path] ?? "",
      caption: row.caption,
      author_name: profileMap.get(row.created_by) ?? "Пользователь",
      created_at: row.created_at,
    })) ?? []
  );
}

export async function loadMovieCollections(ctx: HubContext) {
  const { data: rows } = await ctx.supabase
    .from("movie_collections")
    .select("id, title, created_by, created_at")
    .eq("couple_id", ctx.coupleId)
    .order("created_at", { ascending: false });

  if (!rows?.length) {
    return [];
  }

  const collectionIds = rows.map((row) => row.id);
  const { data: itemRows } = await ctx.supabase
    .from("movie_collection_items")
    .select("id, collection_id, movie_entry_id, title, tmdb_id, poster_path, sort_order")
    .in("collection_id", collectionIds)
    .order("sort_order", { ascending: true });

  const profileMap = await loadProfileMap(
    ctx.supabase,
    [...new Set(rows.map((row) => row.created_by))],
  );

  const itemsByCollection = new Map<string, NonNullable<typeof itemRows>>();
  for (const item of itemRows ?? []) {
    const list = itemsByCollection.get(item.collection_id) ?? [];
    list.push(item);
    itemsByCollection.set(item.collection_id, list);
  }

  return rows.map((row) => ({
    id: row.id,
    title: row.title,
    created_at: row.created_at,
    author_name: profileMap.get(row.created_by) ?? "Пользователь",
    items:
      itemsByCollection.get(row.id)?.map((item) => ({
        id: item.id,
        title: item.title ?? "Без названия",
        poster_url: item.poster_path ? `https://image.tmdb.org/t/p/w342${item.poster_path}` : null,
        movie_entry_id: item.movie_entry_id,
      })) ?? [],
  }));
}

export async function loadHubTravel(ctx: HubContext) {
  const { data: rows } = await ctx.supabase
    .from("travel_plans")
    .select("id, country, description, planned_date, status, created_by, completed_at, created_at")
    .eq("couple_id", ctx.coupleId)
    .order("created_at", { ascending: false });

  const profileMap = await loadProfileMap(
    ctx.supabase,
    [...new Set((rows ?? []).map((row) => row.created_by))],
  );

  return (
    rows?.map((row) => ({
      id: row.id,
      country: row.country,
      description: row.description,
      planned_date: row.planned_date,
      status: row.status as "planned" | "completed",
      author_name: profileMap.get(row.created_by) ?? "Пользователь",
      completed_at: row.completed_at,
      created_at: row.created_at,
    })) ?? []
  );
}

export async function loadHubChores(ctx: HubContext) {
  const { data: rows } = await ctx.supabase
    .from("household_chores")
    .select("id, title, due_date, assigned_to, status, created_by, completed_by, completed_at, created_at")
    .eq("couple_id", ctx.coupleId)
    .order("created_at", { ascending: false });

  const profileMap = await loadProfileMap(ctx.supabase, [
    ...new Set([
      ...(rows ?? []).map((row) => row.created_by),
      ...(rows ?? []).map((row) => row.assigned_to).filter(Boolean) as string[],
      ...(rows ?? []).map((row) => row.completed_by).filter(Boolean) as string[],
    ]),
  ]);

  return (
    rows?.map((row) => ({
      id: row.id,
      title: row.title,
      due_date: row.due_date,
      assigned_to_name: row.assigned_to ? profileMap.get(row.assigned_to) ?? null : null,
      status: row.status as "pending" | "done",
      author_name: profileMap.get(row.created_by) ?? "Пользователь",
      completed_by_name: row.completed_by ? profileMap.get(row.completed_by) ?? null : null,
      completed_at: row.completed_at,
      created_at: row.created_at,
    })) ?? []
  );
}

export async function loadHubCountdowns(ctx: HubContext) {
  const { data: rows } = await ctx.supabase
    .from("countdown_events")
    .select("id, title, target_date, created_by, created_at")
    .eq("couple_id", ctx.coupleId)
    .order("target_date", { ascending: true });

  const profileMap = await loadProfileMap(
    ctx.supabase,
    [...new Set((rows ?? []).map((row) => row.created_by))],
  );

  return (
    rows?.map((row) => ({
      id: row.id,
      title: row.title,
      target_date: row.target_date,
      author_name: profileMap.get(row.created_by) ?? "Пользователь",
      created_at: row.created_at,
    })) ?? []
  );
}

export async function loadNearestCountdown(ctx: HubContext) {
  const today = new Date().toISOString().slice(0, 10);
  const { data: row } = await ctx.supabase
    .from("countdown_events")
    .select("id, title, target_date")
    .eq("couple_id", ctx.coupleId)
    .eq("show_on_dashboard", true)
    .gte("target_date", today)
    .order("target_date", { ascending: true })
    .limit(1)
    .maybeSingle();

  if (!row) {
    return null;
  }

  return {
    id: row.id,
    title: row.title,
    target_date: row.target_date,
  };
}

export async function loadHubHabits(ctx: HubContext) {
  const { data: rows } = await ctx.supabase
    .from("habits")
    .select("id, title, description, motivation, planned_date, status, created_by, created_at")
    .eq("couple_id", ctx.coupleId)
    .order("created_at", { ascending: false });

  const profileMap = await loadProfileMap(
    ctx.supabase,
    [...new Set((rows ?? []).map((row) => row.created_by))],
  );

  return (
    rows?.map((row) => ({
      id: row.id,
      title: row.title,
      description: row.description,
      motivation: row.motivation,
      planned_date: row.planned_date,
      status: row.status as "active" | "completed",
      author_name: profileMap.get(row.created_by) ?? "Пользователь",
      created_at: row.created_at,
    })) ?? []
  );
}

export async function loadHubCatalog(ctx: HubContext, kind: CatalogKind): Promise<CatalogEntry[]> {
  const { data: rows } = await ctx.supabase
    .from("catalog_entries")
    .select("id, external_id, title, poster_url, status, ratings, reviews, added_by, completed_at, created_at")
    .eq("couple_id", ctx.coupleId)
    .eq("kind", kind)
    .order("created_at", { ascending: false });

  const profileMap = await loadProfileMap(
    ctx.supabase,
    [...new Set((rows ?? []).map((row) => row.added_by))],
  );

  return (
    rows?.map((row) => ({
      id: row.id,
      external_id: row.external_id,
      title: row.title,
      poster_url: row.poster_url,
      status: row.status as "want" | "completed",
      ratings: (row.ratings as Record<string, number>) ?? {},
      reviews: (row.reviews as Record<string, string>) ?? {},
      author_name: profileMap.get(row.added_by) ?? "Пользователь",
      completed_at: row.completed_at,
      created_at: row.created_at,
    })) ?? []
  );
}

export type HubGalleryItem = {
  id: string;
  media_url: string;
  caption: string | null;
  author_name: string;
  created_at: string;
  comments: Array<{
    id: string;
    body: string;
    author_name: string;
    created_at: string;
  }>;
};

export async function loadHubGallery(ctx: HubContext): Promise<HubGalleryItem[]> {
  const { data: rows } = await ctx.supabase
    .from("couple_gallery")
    .select("id, media_path, caption, created_by, created_at")
    .eq("couple_id", ctx.coupleId)
    .order("created_at", { ascending: false });

  if (!rows?.length) {
    return [];
  }

  const galleryIds = rows.map((row) => row.id);
  const { data: commentRows } = await ctx.supabase
    .from("gallery_comments")
    .select("id, gallery_id, body, author_id, created_at")
    .in("gallery_id", galleryIds)
    .order("created_at", { ascending: true });

  const profileMap = await loadProfileMap(ctx.supabase, [
    ...new Set([
      ...rows.map((row) => row.created_by),
      ...(commentRows ?? []).map((row) => row.author_id),
    ]),
  ]);

  const signed = await signMediaPaths(
    ctx.supabase,
    rows.map((row) => row.media_path).filter(Boolean),
  );

  const commentsByGallery = new Map<string, HubGalleryItem["comments"]>();
  for (const comment of commentRows ?? []) {
    const list = commentsByGallery.get(comment.gallery_id) ?? [];
    list.push({
      id: comment.id,
      body: comment.body,
      author_name: profileMap.get(comment.author_id) ?? "Пользователь",
      created_at: comment.created_at,
    });
    commentsByGallery.set(comment.gallery_id, list);
  }

  return rows.map((row) => ({
    id: row.id,
    media_url: signed[row.media_path] ?? "",
    caption: row.caption,
    author_name: profileMap.get(row.created_by) ?? "Пользователь",
    created_at: row.created_at,
    comments: commentsByGallery.get(row.id) ?? [],
  }));
}

export type MenstrualCycleData = {
  tracked_by: string;
  last_period_start: string | null;
  cycle_length_days: number;
  period_length_days: number;
  updated_at: string;
};

export async function loadMenstrualCycle(ctx: HubContext): Promise<MenstrualCycleData | null> {
  const { data: row } = await ctx.supabase
    .from("menstrual_cycles")
    .select("tracked_by, last_period_start, cycle_length_days, period_length_days, updated_at")
    .eq("couple_id", ctx.coupleId)
    .maybeSingle();

  if (!row) {
    return null;
  }

  return {
    tracked_by: row.tracked_by,
    last_period_start: row.last_period_start,
    cycle_length_days: row.cycle_length_days,
    period_length_days: row.period_length_days,
    updated_at: row.updated_at,
  };
}
