"use server";

import { revalidatePath } from "next/cache";
import { getAuthContext } from "@/lib/couple/context.server";
import { actionError } from "@/lib/validation/forms";

export async function addBookEntry(input: {
  title: string;
  author?: string;
  rating?: number;
  review?: string;
  finishedOn?: string;
}) {
  const { supabase, user, context } = await getAuthContext();
  if (!context?.isComplete) {
    return actionError("Пара не подключена.");
  }

  const title = input.title.trim();
  if (!title) {
    return actionError("Укажите название книги.");
  }

  const { error } = await supabase.from("book_entries").insert({
    couple_id: context.coupleId,
    added_by: user.id,
    title,
    author: input.author?.trim() || null,
    rating: input.rating ?? null,
    review: input.review?.trim() || null,
    finished_on: input.finishedOn || null,
  });

  if (error) {
    return actionError("Не удалось сохранить книгу.");
  }

  revalidatePath("/memories/books");
  revalidatePath("/memories");
  return { ok: true as const };
}

export async function addBookToWantList(input: { title: string; author?: string }) {
  const { supabase, user, context } = await getAuthContext();
  if (!context?.isComplete) {
    return actionError("Пара не подключена.");
  }

  const title = input.title.trim();
  if (!title) {
    return actionError("Укажите название книги.");
  }

  const { error } = await supabase.from("book_entries").insert({
    couple_id: context.coupleId,
    added_by: user.id,
    title,
    author: input.author?.trim() || null,
    status: "want",
    ratings: {},
    reviews: {},
  });

  if (error) {
    return actionError("Не удалось добавить книгу.");
  }

  revalidatePath("/memories/books");
  revalidatePath("/memories");
  return { ok: true as const };
}

export async function markBookRead(bookId: string, rating: number, review: string) {
  const { supabase, user, context } = await getAuthContext();
  if (!context?.isComplete) {
    return actionError("Пара не подключена.");
  }

  if (rating < 1 || rating > 10) {
    return actionError("Оценка от 1 до 10.");
  }

  const { data: book } = await supabase
    .from("book_entries")
    .select("id, ratings, reviews")
    .eq("id", bookId)
    .eq("couple_id", context.coupleId)
    .maybeSingle();

  if (!book) {
    return actionError("Книга не найдена.");
  }

  const ratings = {
    ...(book.ratings as Record<string, number>),
    [user.id]: rating,
  };

  const reviews = {
    ...(book.reviews as Record<string, string>),
  };
  const trimmedReview = review.trim();
  if (trimmedReview) {
    reviews[user.id] = trimmedReview.slice(0, 1000);
  } else {
    delete reviews[user.id];
  }

  const { error } = await supabase
    .from("book_entries")
    .update({
      status: "read",
      ratings,
      reviews,
      read_at: new Date().toISOString(),
    })
    .eq("id", bookId);

  if (error) {
    return actionError("Не удалось обновить книгу.");
  }

  revalidatePath("/memories/books");
  revalidatePath("/memories");
  return { ok: true as const };
}

export async function saveBookReview(bookId: string, review: string) {
  const { supabase, user, context } = await getAuthContext();
  if (!context?.isComplete) {
    return actionError("Пара не подключена.");
  }

  const { data: book } = await supabase
    .from("book_entries")
    .select("id, reviews, status")
    .eq("id", bookId)
    .eq("couple_id", context.coupleId)
    .maybeSingle();

  if (!book) {
    return actionError("Книга не найдена.");
  }

  if (book.status !== "read") {
    return actionError("Отзыв можно оставить только для прочитанной книги.");
  }

  const reviews = {
    ...(book.reviews as Record<string, string>),
  };
  const trimmedReview = review.trim();
  if (trimmedReview) {
    reviews[user.id] = trimmedReview.slice(0, 1000);
  } else {
    delete reviews[user.id];
  }

  const { error } = await supabase.from("book_entries").update({ reviews }).eq("id", bookId);

  if (error) {
    return actionError("Не удалось сохранить отзыв.");
  }

  revalidatePath("/memories/books");
  return { ok: true as const };
}
