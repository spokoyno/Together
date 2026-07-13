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
