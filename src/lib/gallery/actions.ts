"use server";

import { revalidatePath } from "next/cache";
import { getAuthContext } from "@/lib/couple/context.server";
import { actionError } from "@/lib/validation/forms";

export async function addGalleryComment(galleryId: string, body: string) {
  const { supabase, user, context } = await getAuthContext();
  if (!context?.isComplete) {
    return actionError("Пара не подключена.");
  }

  const text = body.trim();
  if (!text || text.length > 500) {
    return actionError("Комментарий от 1 до 500 символов.");
  }

  const { error } = await supabase.from("gallery_comments").insert({
    gallery_id: galleryId,
    author_id: user.id,
    body: text,
  });

  if (error) {
    return actionError("Не удалось добавить комментарий.");
  }

  revalidatePath("/memories/gallery");
  return { ok: true as const };
}

export async function addGalleryPhotos(paths: string[]) {
  const { supabase, user, context } = await getAuthContext();
  if (!context?.isComplete) {
    return actionError("Пара не подключена.");
  }

  const cleaned = paths.map((path) => path.trim()).filter(Boolean);
  if (!cleaned.length) {
    return actionError("Выберите фото.");
  }

  const rows = cleaned.map((mediaPath) => ({
    couple_id: context.coupleId,
    created_by: user.id,
    media_path: mediaPath,
  }));

  const { error } = await supabase.from("couple_gallery").insert(rows);

  if (error) {
    return actionError("Не удалось загрузить фото.");
  }

  revalidatePath("/memories/gallery");
  revalidatePath("/dashboard");
  return { ok: true as const };
}
