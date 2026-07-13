import { redirect } from "next/navigation";
import { HubShell } from "@/components/features/hub/hub-shell";
import type {
  HubComment,
  HubCookingDish,
  HubCookingLog,
  HubMemory,
  HubMovie,
} from "@/components/features/hub/types";
import { requireUser } from "@/lib/auth/session";
import { getCoupleContextForUser } from "@/lib/couple/context.server";
import { buildComplimentState } from "@/lib/hub/compliment-state.server";
import { signMediaPaths } from "@/lib/media/actions";

export default async function MemoriesPage() {
  const { supabase, user } = await requireUser();
  const context = await getCoupleContextForUser(user.id);

  if (!context?.isComplete || !context.partner) {
    redirect("/dashboard");
  }

  const partnerId = context.partner.id;

  const [
    memoryRows,
    commentRows,
    movieRows,
    dishRows,
    logRows,
    partnerCompliments,
    myCompliments,
    drawState,
    profileRows,
  ] = await Promise.all([
    supabase
      .from("memories")
      .select("id, title, body, happened_on, media_path, created_at, created_by, moment_type")
      .eq("couple_id", context.coupleId)
      .in("moment_type", ["memory", "photo"])
      .order("created_at", { ascending: false }),
    supabase
      .from("moment_comments")
      .select("id, memory_id, body, created_at, author_id")
      .order("created_at", { ascending: true }),
    supabase
      .from("movie_entries")
      .select("id, tmdb_id, title, poster_path, ratings, added_by, created_at")
      .eq("couple_id", context.coupleId)
      .order("created_at", { ascending: false }),
    supabase
      .from("cooking_dishes")
      .select("id, title, recipe, media_path, status, cooked_at, created_at, created_by")
      .eq("couple_id", context.coupleId)
      .order("created_at", { ascending: false }),
    supabase
      .from("cooking_logs")
      .select("id, dish_id, body, media_path, created_at, author_id")
      .order("created_at", { ascending: false }),
    supabase
      .from("compliments")
      .select("id", { count: "exact", head: true })
      .eq("couple_id", context.coupleId)
      .eq("target_user_id", partnerId)
      .eq("author_id", user.id),
    supabase
      .from("compliments")
      .select("id", { count: "exact", head: true })
      .eq("couple_id", context.coupleId)
      .eq("target_user_id", user.id),
    supabase
      .from("compliment_draw_state")
      .select("last_draw_at")
      .eq("user_id", user.id)
      .maybeSingle(),
    supabase
      .from("profiles")
      .select("id, display_name")
      .in("id", [user.id, partnerId]),
  ]);

  const profileMap = new Map(
    (profileRows.data ?? []).map((profile) => [profile.id, profile.display_name]),
  );

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

  const mediaPaths = [
    ...(memoryRows.data ?? []).map((row) => row.media_path),
    ...(dishRows.data ?? []).map((row) => row.media_path),
    ...(logRows.data ?? []).map((row) => row.media_path),
  ].filter((path): path is string => Boolean(path));

  const signedUrls = await signMediaPaths(supabase, mediaPaths);

  const memories: HubMemory[] =
    memoryRows.data?.map((row) => ({
      id: row.id,
      title: row.title,
      body: row.body,
      happened_on: row.happened_on,
      media_url: row.media_path ? signedUrls[row.media_path] ?? null : null,
      created_at: row.created_at,
      author_name: profileMap.get(row.created_by) ?? "Пользователь",
      comments: commentsByMemory.get(row.id) ?? [],
    })) ?? [];

  const movies: HubMovie[] =
    movieRows.data?.map((row) => ({
      id: row.id,
      tmdb_id: row.tmdb_id,
      title: row.title,
      poster_url: row.poster_path
        ? `https://image.tmdb.org/t/p/w342${row.poster_path}`
        : null,
      ratings: (row.ratings ?? {}) as Record<string, number>,
      added_by: row.added_by,
    })) ?? [];

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

  const dishes: HubCookingDish[] =
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
    })) ?? [];

  const complimentState = buildComplimentState({
    partnerJarCount: partnerCompliments.count ?? 0,
    myJarCount: myCompliments.count ?? 0,
    lastDrawAt: drawState.data?.last_draw_at ?? null,
  });

  return (
    <main className="mx-auto min-h-screen max-w-md px-5 pb-32 pt-8">
      <HubShell
        complimentState={complimentState}
        coupleId={context.coupleId}
        dishes={dishes}
        memories={memories}
        movies={movies}
        partnerId={partnerId}
        partnerName={context.partner.display_name}
        userId={user.id}
      />
    </main>
  );
}
