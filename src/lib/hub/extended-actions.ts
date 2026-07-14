"use server";

import { revalidatePath } from "next/cache";
import { getAuthContext } from "@/lib/couple/context.server";
import { createInAppNotification } from "@/lib/notifications/actions";
import { actionError } from "@/lib/validation/forms";

export async function addShoppingNote(body: string) {
  const { supabase, user, context } = await getAuthContext();
  if (!context?.isComplete) {
    return actionError("Пара не подключена.");
  }

  const text = body.trim();
  if (!text) {
    return actionError("Напишите список покупок.");
  }

  const { error } = await supabase.from("shopping_notes").insert({
    couple_id: context.coupleId,
    created_by: user.id,
    body: text,
  });

  if (error) {
    return actionError("Не удалось добавить записку.");
  }

  revalidatePath("/memories");
  return { ok: true as const };
}

export async function closeShoppingNote(noteId: string) {
  const { supabase, user, context } = await getAuthContext();
  if (!context?.isComplete) {
    return actionError("Пара не подключена.");
  }

  const { error } = await supabase
    .from("shopping_notes")
    .update({
      status: "closed",
      closed_by: user.id,
      closed_at: new Date().toISOString(),
    })
    .eq("id", noteId)
    .eq("couple_id", context.coupleId);

  if (error) {
    return actionError("Не удалось закрыть записку.");
  }

  revalidatePath("/memories");
  return { ok: true as const };
}

export async function addWishlistItem(formData: FormData) {
  const { supabase, user, context } = await getAuthContext();
  if (!context?.isComplete) {
    return actionError("Пара не подключена.");
  }

  const title = formData.get("title");
  const description = formData.get("description");
  const mediaPath = formData.get("mediaPath");

  if (typeof title !== "string" || !title.trim()) {
    return actionError("Укажите название.");
  }

  const { error } = await supabase.from("wishlist_items").insert({
    couple_id: context.coupleId,
    created_by: user.id,
    title: title.trim(),
    description: typeof description === "string" && description.trim() ? description.trim() : null,
    media_path: typeof mediaPath === "string" && mediaPath.trim() ? mediaPath.trim() : null,
  });

  if (error) {
    return actionError("Не удалось добавить желание.");
  }

  revalidatePath("/memories");
  return { ok: true as const };
}

export async function fulfillWishlistItem(itemId: string) {
  const { supabase, user, context } = await getAuthContext();
  if (!context?.isComplete) {
    return actionError("Пара не подключена.");
  }

  const { error } = await supabase
    .from("wishlist_items")
    .update({
      status: "fulfilled",
      fulfilled_by: user.id,
      fulfilled_at: new Date().toISOString(),
    })
    .eq("id", itemId)
    .eq("couple_id", context.coupleId);

  if (error) {
    return actionError("Не удалось отметить желание.");
  }

  revalidatePath("/memories");
  return { ok: true as const };
}

export async function wishlistToSurprisePlan(itemId: string, dueAt: string) {
  const { supabase, user, context } = await getAuthContext();
  if (!context?.isComplete) {
    return actionError("Пара не подключена.");
  }

  const parsedDate = new Date(dueAt);
  if (Number.isNaN(parsedDate.getTime())) {
    return actionError("Некорректная дата.");
  }

  const { data: item } = await supabase
    .from("wishlist_items")
    .select("id, title, description")
    .eq("id", itemId)
    .eq("couple_id", context.coupleId)
    .maybeSingle();

  if (!item) {
    return actionError("Желание не найдено.");
  }

  const { error } = await supabase.from("plans").insert({
    couple_id: context.coupleId,
    created_by: user.id,
    title: item.title,
    details: item.description,
    due_at: parsedDate.toISOString(),
    is_surprise: true,
    category: "other",
  });

  if (error) {
    return actionError("Не удалось создать сюрприз-план.");
  }

  revalidatePath("/plans");
  revalidatePath("/memories");
  return { ok: true as const };
}

export async function addPartnerFact(targetUserId: string, trait: string, description: string) {
  const { supabase, user, context } = await getAuthContext();
  if (!context?.isComplete) {
    return actionError("Пара не подключена.");
  }

  if (!trait.trim() || !description.trim()) {
    return actionError("Заполните характеристику и описание.");
  }

  const { error } = await supabase.from("partner_facts").insert({
    couple_id: context.coupleId,
    target_user_id: targetUserId,
    author_id: user.id,
    trait: trait.trim(),
    description: description.trim(),
  });

  if (error) {
    return actionError("Не удалось сохранить.");
  }

  revalidatePath("/profile/partner");
  return { ok: true as const };
}

export async function addGalleryPhoto(formData: FormData) {
  const { supabase, user, context } = await getAuthContext();
  if (!context?.isComplete) {
    return actionError("Пара не подключена.");
  }

  const mediaPath = formData.get("mediaPath");
  const caption = formData.get("caption");

  if (typeof mediaPath !== "string" || !mediaPath.trim()) {
    return actionError("Прикрепите фото.");
  }

  const { error } = await supabase.from("couple_gallery").insert({
    couple_id: context.coupleId,
    created_by: user.id,
    media_path: mediaPath.trim(),
    caption: typeof caption === "string" && caption.trim() ? caption.trim() : null,
  });

  if (error) {
    return actionError("Не удалось добавить в галерею.");
  }

  revalidatePath("/memories/gallery");
  revalidatePath("/profile/partner");
  return { ok: true as const };
}

export async function sendTierChallenge(targetUserId: string, url: string) {
  const { supabase, user, context } = await getAuthContext();
  if (!context?.isComplete) {
    return actionError("Пара не подключена.");
  }

  const trimmedUrl = url.trim();
  if (!trimmedUrl) {
    return actionError("Укажите ссылку на тир-лист.");
  }

  let parsedUrl: URL;
  try {
    parsedUrl = new URL(trimmedUrl);
  } catch {
    return actionError("Некорректная ссылка.");
  }

  const host = parsedUrl.hostname.toLowerCase();
  if (host !== "tiermaker.com" && !host.endsWith(".tiermaker.com")) {
    return actionError("Ссылка должна вести на tiermaker.com.");
  }

  const { tierTitleFromUrl } = await import("@/lib/hub/tier-utils");
  const title = tierTitleFromUrl(trimmedUrl);

  const { data: challenge, error } = await supabase
    .from("tier_list_challenges")
    .insert({
      couple_id: context.coupleId,
      challenger_id: user.id,
      target_user_id: targetUserId,
      tier_list_url: trimmedUrl,
      tier_list_title: title,
    })
    .select("id")
    .single();

  if (error || !challenge) {
    return actionError("Не удалось отправить вызов.");
  }

  await createInAppNotification({
    supabase,
    coupleId: context.coupleId,
    userId: targetUserId,
    type: "tier_challenge",
    title: "Вызов на тир-лист",
    body: title,
    linkPath: "/memories/tiers",
    referenceId: challenge.id,
  });

  revalidatePath("/memories/tiers");
  revalidatePath("/profile");
  return { ok: true as const };
}

export async function completeTierChallenge(challengeId: string, formData: FormData) {
  const { supabase, user, context } = await getAuthContext();
  if (!context?.isComplete) {
    return actionError("Пара не подключена.");
  }

  const mediaPath = formData.get("mediaPath");
  const resultUrl = formData.get("resultUrl");
  const hasMedia = typeof mediaPath === "string" && mediaPath.trim();
  const hasUrl = typeof resultUrl === "string" && resultUrl.trim();

  if (!hasMedia && !hasUrl) {
    return actionError("Прикрепите скриншот или ссылку на результат.");
  }

  if (hasUrl) {
    try {
      new URL(resultUrl.trim());
    } catch {
      return actionError("Некорректная ссылка на результат.");
    }
  }

  const { error } = await supabase
    .from("tier_list_challenges")
    .update({
      status: "completed",
      result_image_path: hasMedia ? mediaPath.trim() : null,
      result_url: hasUrl ? resultUrl.trim() : null,
      completed_at: new Date().toISOString(),
    })
    .eq("id", challengeId)
    .eq("target_user_id", user.id)
    .eq("couple_id", context.coupleId)
    .eq("status", "pending");

  if (error) {
    return actionError("Не удалось сохранить результат.");
  }

  revalidatePath("/memories/tiers");
  revalidatePath("/memories");
  return { ok: true as const };
}

export async function addTierListComment(challengeId: string, body: string) {
  const { supabase, user, context } = await getAuthContext();
  if (!context?.isComplete) {
    return actionError("Пара не подключена.");
  }

  const text = body.trim();
  if (!text) {
    return actionError("Напишите комментарий.");
  }

  const { error } = await supabase.from("tier_list_comments").insert({
    challenge_id: challengeId,
    author_id: user.id,
    body: text,
  });

  if (error) {
    return actionError("Не удалось сохранить комментарий.");
  }

  revalidatePath("/memories/tiers");
  return { ok: true as const };
}

export async function markMovieWatched(movieId: string, rating: number, review: string) {
  const { supabase, user, context } = await getAuthContext();
  if (!context?.isComplete) {
    return actionError("Пара не подключена.");
  }

  const { data: movie } = await supabase
    .from("movie_entries")
    .select("id, ratings, reviews")
    .eq("id", movieId)
    .eq("couple_id", context.coupleId)
    .maybeSingle();

  if (!movie) {
    return actionError("Фильм не найден.");
  }

  const ratings = {
    ...(movie.ratings as Record<string, number>),
    [user.id]: rating,
  };

  const reviews = {
    ...(movie.reviews as Record<string, string>),
  };
  const trimmedReview = review.trim();
  if (trimmedReview) {
    reviews[user.id] = trimmedReview.slice(0, 500);
  } else {
    delete reviews[user.id];
  }

  const { error } = await supabase
    .from("movie_entries")
    .update({
      status: "watched",
      ratings,
      reviews,
      watched_at: new Date().toISOString(),
    })
    .eq("id", movieId);

  if (error) {
    return actionError("Не удалось обновить фильм.");
  }

  revalidatePath("/memories/movies");
  revalidatePath("/memories");
  return { ok: true as const };
}

export async function saveMovieReview(movieId: string, review: string) {
  const { supabase, user, context } = await getAuthContext();
  if (!context?.isComplete) {
    return actionError("Пара не подключена.");
  }

  const { data: movie } = await supabase
    .from("movie_entries")
    .select("id, reviews, status")
    .eq("id", movieId)
    .eq("couple_id", context.coupleId)
    .maybeSingle();

  if (!movie) {
    return actionError("Фильм не найден.");
  }

  if (movie.status !== "watched") {
    return actionError("Отзыв можно оставить только для просмотренного фильма.");
  }

  const reviews = {
    ...(movie.reviews as Record<string, string>),
  };
  const trimmedReview = review.trim();
  if (trimmedReview) {
    reviews[user.id] = trimmedReview.slice(0, 500);
  } else {
    delete reviews[user.id];
  }

  const { error } = await supabase.from("movie_entries").update({ reviews }).eq("id", movieId);

  if (error) {
    return actionError("Не удалось сохранить отзыв.");
  }

  revalidatePath("/memories/movies");
  return { ok: true as const };
}

export async function updateMovieRating(movieId: string, rating: number) {
  const { supabase, user, context } = await getAuthContext();
  if (!context?.isComplete) {
    return actionError("Пара не подключена.");
  }

  const { data: movie } = await supabase
    .from("movie_entries")
    .select("id, ratings, status")
    .eq("id", movieId)
    .eq("couple_id", context.coupleId)
    .maybeSingle();

  if (!movie || movie.status !== "watched") {
    return actionError("Фильм не найден.");
  }

  const ratings = {
    ...(movie.ratings as Record<string, number>),
    [user.id]: rating,
  };

  const { error } = await supabase.from("movie_entries").update({ ratings }).eq("id", movieId);

  if (error) {
    return actionError("Не удалось обновить оценку.");
  }

  revalidatePath("/memories/movies");
  return { ok: true as const };
}

export async function addMovieToCollection(collectionId: string, movieEntryId: string) {
  const { supabase, context } = await getAuthContext();
  if (!context?.isComplete) {
    return actionError("Пара не подключена.");
  }

  const [{ data: collection }, { data: movie }] = await Promise.all([
    supabase
      .from("movie_collections")
      .select("id")
      .eq("id", collectionId)
      .eq("couple_id", context.coupleId)
      .maybeSingle(),
    supabase
      .from("movie_entries")
      .select("id, title, tmdb_id, poster_path")
      .eq("id", movieEntryId)
      .eq("couple_id", context.coupleId)
      .maybeSingle(),
  ]);

  if (!collection) {
    return actionError("Подборка не найдена.");
  }

  if (!movie) {
    return actionError("Фильм не найден.");
  }

  const { count } = await supabase
    .from("movie_collection_items")
    .select("id", { count: "exact", head: true })
    .eq("collection_id", collectionId);

  const { error } = await supabase.from("movie_collection_items").insert({
    collection_id: collectionId,
    movie_entry_id: movie.id,
    title: movie.title,
    tmdb_id: movie.tmdb_id,
    poster_path: movie.poster_path,
    sort_order: count ?? 0,
  });

  if (error) {
    return actionError("Не удалось добавить в подборку.");
  }

  revalidatePath("/memories/movies");
  return { ok: true as const };
}

export async function createMovieCollection(title: string, movieEntryIds: string[] = []) {
  const { supabase, user, context } = await getAuthContext();
  if (!context?.isComplete) {
    return actionError("Пара не подключена.");
  }

  const trimmed = title.trim();
  if (!trimmed) {
    return actionError("Укажите название подборки.");
  }

  const { data: collection, error } = await supabase
    .from("movie_collections")
    .insert({
      couple_id: context.coupleId,
      created_by: user.id,
      title: trimmed,
    })
    .select("id")
    .single();

  if (error || !collection) {
    return actionError("Не удалось создать подборку.");
  }

  if (movieEntryIds.length) {
    const { data: movies } = await supabase
      .from("movie_entries")
      .select("id, title, tmdb_id, poster_path")
      .eq("couple_id", context.coupleId)
      .in("id", movieEntryIds);

    for (const [index, movie] of (movies ?? []).entries()) {
      await supabase.from("movie_collection_items").insert({
        collection_id: collection.id,
        movie_entry_id: movie.id,
        title: movie.title,
        tmdb_id: movie.tmdb_id,
        poster_path: movie.poster_path,
        sort_order: index,
      });
    }
  }

  revalidatePath("/memories/movies");
  return { ok: true as const };
}
