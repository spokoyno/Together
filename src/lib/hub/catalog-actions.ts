"use server";

import { revalidatePath } from "next/cache";
import { getAuthContext } from "@/lib/couple/context.server";
import { CATALOG_HREFS, type CatalogKind } from "@/lib/hub/catalog";
import { actionError } from "@/lib/validation/forms";

function revalidateCatalog(kind: CatalogKind) {
  revalidatePath(CATALOG_HREFS[kind]);
  revalidatePath("/memories");
  revalidatePath("/dashboard");
}

export async function addCatalogEntry(payload: {
  kind: CatalogKind;
  externalId: number;
  title: string;
  posterUrl: string | null;
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
    .from("catalog_entries")
    .select("id, ratings")
    .eq("couple_id", context.coupleId)
    .eq("kind", payload.kind)
    .eq("external_id", payload.externalId)
    .maybeSingle();

  if (existing) {
    const ratings = {
      ...(existing.ratings as Record<string, number>),
      [user.id]: payload.rating,
    };
    const { error } = await supabase
      .from("catalog_entries")
      .update({ ratings })
      .eq("id", existing.id)
      .eq("couple_id", context.coupleId);

    if (error) {
      return actionError("Не удалось обновить оценку.");
    }
  } else {
    const { error } = await supabase.from("catalog_entries").insert({
      couple_id: context.coupleId,
      added_by: user.id,
      kind: payload.kind,
      external_id: payload.externalId,
      title: payload.title,
      poster_url: payload.posterUrl,
      status: "want",
      ratings: { [user.id]: payload.rating },
    });

    if (error) {
      return actionError("Не удалось добавить.");
    }
  }

  revalidateCatalog(payload.kind);
  return { ok: true as const };
}

export async function markCatalogCompleted(
  entryId: string,
  kind: CatalogKind,
  rating: number,
  review?: string,
) {
  const { supabase, user, context } = await getAuthContext();
  if (!context?.isComplete) {
    return actionError("Пара не подключена.");
  }

  if (rating < 1 || rating > 10) {
    return actionError("Оценка от 1 до 10.");
  }

  const { data: entry } = await supabase
    .from("catalog_entries")
    .select("id, ratings, reviews")
    .eq("id", entryId)
    .eq("couple_id", context.coupleId)
    .eq("kind", kind)
    .maybeSingle();

  if (!entry) {
    return actionError("Запись не найдена.");
  }

  const ratings = { ...(entry.ratings as Record<string, number>), [user.id]: rating };
  const reviews = { ...(entry.reviews as Record<string, string>) };
  if (review?.trim()) {
    reviews[user.id] = review.trim().slice(0, 1000);
  }

  const { error } = await supabase
    .from("catalog_entries")
    .update({
      status: "completed",
      ratings,
      reviews,
      completed_at: new Date().toISOString(),
    })
    .eq("id", entryId)
    .eq("couple_id", context.coupleId);

  if (error) {
    return actionError("Не удалось отметить.");
  }

  revalidateCatalog(kind);
  return { ok: true as const };
}

export async function saveCatalogReview(entryId: string, kind: CatalogKind, review: string) {
  const { supabase, user, context } = await getAuthContext();
  if (!context?.isComplete) {
    return actionError("Пара не подключена.");
  }

  const text = review.trim();
  if (!text) {
    return actionError("Напишите отзыв.");
  }

  const { data: entry } = await supabase
    .from("catalog_entries")
    .select("id, reviews")
    .eq("id", entryId)
    .eq("couple_id", context.coupleId)
    .maybeSingle();

  if (!entry) {
    return actionError("Запись не найдена.");
  }

  const reviews = {
    ...(entry.reviews as Record<string, string>),
    [user.id]: text.slice(0, 1000),
  };

  const { error } = await supabase
    .from("catalog_entries")
    .update({ reviews })
    .eq("id", entryId)
    .eq("couple_id", context.coupleId);

  if (error) {
    return actionError("Не удалось сохранить отзыв.");
  }

  revalidateCatalog(kind);
  return { ok: true as const };
}
