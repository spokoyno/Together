"use server";

import { revalidatePath } from "next/cache";
import { getAuthContext } from "@/lib/couple/context.server";
import { actionError } from "@/lib/validation/forms";

const HOUR_MS = 60 * 60 * 1000;

export async function addMomentComment(memoryId: string, body: string) {
  const { supabase, user, context } = await getAuthContext();
  if (!context?.isComplete) {
    return actionError("Пара не подключена.");
  }

  const text = body.trim();
  if (!text || text.length > 500) {
    return actionError("Комментарий от 1 до 500 символов.");
  }

  const { error } = await supabase.from("moment_comments").insert({
    memory_id: memoryId,
    author_id: user.id,
    body: text,
  });

  if (error) {
    return actionError("Не удалось отправить комментарий.");
  }

  revalidatePath("/memories");
  return { ok: true as const };
}

export async function addMovieEntry(payload: {
  tmdbId: number;
  title: string;
  posterPath: string | null;
  rating: number;
}) {
  const { supabase, user, context } = await getAuthContext();
  if (!context?.isComplete) {
    return actionError("Пара не подключена.");
  }

  if (payload.rating < 1 || payload.rating > 10) {
    return actionError("Оценка от 1 до 10.");
  }

  const { data: existing } = await supabase
    .from("movie_entries")
    .select("id, ratings")
    .eq("couple_id", context.coupleId)
    .eq("tmdb_id", payload.tmdbId)
    .maybeSingle();

  if (existing) {
    const ratings = {
      ...(existing.ratings as Record<string, number>),
      [user.id]: payload.rating,
    };

    const { error } = await supabase
      .from("movie_entries")
      .update({ ratings })
      .eq("id", existing.id)
      .eq("couple_id", context.coupleId);

    if (error) {
      return actionError("Не удалось обновить оценку.");
    }
  } else {
    const { error } = await supabase.from("movie_entries").insert({
      couple_id: context.coupleId,
      added_by: user.id,
      tmdb_id: payload.tmdbId,
      title: payload.title,
      poster_path: payload.posterPath,
      status: "want",
      ratings: { [user.id]: payload.rating },
    });

    if (error) {
      return actionError("Не удалось добавить фильм.");
    }
  }

  revalidatePath("/memories");
  return { ok: true as const };
}

export async function rateMovieEntry(movieId: string, rating: number) {
  const { supabase, user, context } = await getAuthContext();
  if (!context?.isComplete) {
    return actionError("Пара не подключена.");
  }

  if (rating < 1 || rating > 10) {
    return actionError("Оценка от 1 до 10.");
  }

  const { data: movie } = await supabase
    .from("movie_entries")
    .select("id, ratings")
    .eq("id", movieId)
    .eq("couple_id", context.coupleId)
    .maybeSingle();

  if (!movie) {
    return actionError("Фильм не найден.");
  }

  const ratings = { ...(movie.ratings as Record<string, number>), [user.id]: rating };

  const { error } = await supabase
    .from("movie_entries")
    .update({ ratings })
    .eq("id", movieId)
    .eq("couple_id", context.coupleId);

  if (error) {
    return actionError("Не удалось сохранить оценку.");
  }

  revalidatePath("/memories");
  return { ok: true as const };
}

export async function addCookingDish(formData: FormData) {
  const { supabase, user, context } = await getAuthContext();
  if (!context?.isComplete) {
    return actionError("Пара не подключена.");
  }

  const title = formData.get("title");
  const recipe = formData.get("recipe");
  const mediaPath = formData.get("mediaPath");

  if (typeof title !== "string" || !title.trim()) {
    return actionError("Укажите название блюда.");
  }

  const { error } = await supabase.from("cooking_dishes").insert({
    couple_id: context.coupleId,
    created_by: user.id,
    title: title.trim(),
    recipe: typeof recipe === "string" && recipe.trim() ? recipe.trim() : null,
    media_path: typeof mediaPath === "string" && mediaPath.trim() ? mediaPath.trim() : null,
  });

  if (error) {
    return actionError("Не удалось добавить блюдо.");
  }

  revalidatePath("/memories");
  return { ok: true as const };
}

export async function markDishCooked(dishId: string, formData: FormData) {
  const { supabase, user, context } = await getAuthContext();
  if (!context?.isComplete) {
    return actionError("Пара не подключена.");
  }

  const body = formData.get("body");
  const mediaPath = formData.get("mediaPath");

  const { error: logError } = await supabase.from("cooking_logs").insert({
    dish_id: dishId,
    author_id: user.id,
    body: typeof body === "string" && body.trim() ? body.trim() : null,
    media_path: typeof mediaPath === "string" && mediaPath.trim() ? mediaPath.trim() : null,
  });

  if (logError) {
    return actionError("Не удалось сохранить запись.");
  }

  await supabase
    .from("cooking_dishes")
    .update({ status: "cooked", cooked_at: new Date().toISOString() })
    .eq("id", dishId)
    .eq("couple_id", context.coupleId);

  revalidatePath("/memories");
  return { ok: true as const };
}

export async function addCookingLog(dishId: string, formData: FormData) {
  const { supabase, user, context } = await getAuthContext();
  if (!context?.isComplete) {
    return actionError("Пара не подключена.");
  }

  const body = formData.get("body");
  const mediaPath = formData.get("mediaPath");

  const { data: dish } = await supabase
    .from("cooking_dishes")
    .select("id, status")
    .eq("id", dishId)
    .eq("couple_id", context.coupleId)
    .maybeSingle();

  if (!dish || dish.status !== "cooked") {
    return actionError("Блюдо не найдено или ещё не приготовлено.");
  }

  const { error } = await supabase.from("cooking_logs").insert({
    dish_id: dishId,
    author_id: user.id,
    body: typeof body === "string" && body.trim() ? body.trim() : null,
    media_path: typeof mediaPath === "string" && mediaPath.trim() ? mediaPath.trim() : null,
  });

  if (error) {
    return actionError("Не удалось добавить комментарий.");
  }

  revalidatePath("/memories");
  return { ok: true as const };
}

export async function addCompliment(body: string) {
  const { supabase, user, context } = await getAuthContext();
  if (!context?.isComplete || !context.partner) {
    return actionError("Пара не подключена.");
  }

  const text = body.trim();
  if (!text || text.length > 280) {
    return actionError("Комплимент от 1 до 280 символов.");
  }

  const { error } = await supabase.from("compliments").insert({
    couple_id: context.coupleId,
    author_id: user.id,
    target_user_id: context.partner.id,
    body: text,
  });

  if (error) {
    return actionError("Не удалось добавить комплимент.");
  }

  revalidatePath("/memories");
  return { ok: true as const };
}

export async function drawCompliment(): Promise<
  { ok: true; text: string } | { ok: false; error: string; waitMinutes?: number }
> {
  const { supabase, user, context } = await getAuthContext();
  if (!context?.isComplete) {
    return actionError("Пара не подключена.");
  }

  const { data: state } = await supabase
    .from("compliment_draw_state")
    .select("last_draw_at")
    .eq("user_id", user.id)
    .maybeSingle();

  if (state?.last_draw_at) {
    const elapsed = Date.now() - new Date(state.last_draw_at).getTime();
    if (elapsed < HOUR_MS) {
      return {
        ok: false,
        error: "Можно доставать комплимент раз в час.",
        waitMinutes: Math.ceil((HOUR_MS - elapsed) / 60000),
      };
    }
  }

  const { data: compliments } = await supabase
    .from("compliments")
    .select("id, body")
    .eq("couple_id", context.coupleId)
    .eq("target_user_id", user.id)
    .limit(50);

  if (!compliments?.length) {
    return actionError("Банка пуста — попросите партнёра добавить комплимент.");
  }

  const picked = compliments[Math.floor(Math.random() * compliments.length)]!;

  await supabase.from("compliments").delete().eq("id", picked.id);

  await supabase.from("compliment_draw_state").upsert({
    user_id: user.id,
    couple_id: context.coupleId,
    last_draw_at: new Date().toISOString(),
  });

  revalidatePath("/memories");
  return { ok: true, text: picked.body };
}
