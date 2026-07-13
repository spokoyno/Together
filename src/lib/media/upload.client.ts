"use client";

import { createClient } from "@/lib/supabase/client";

type UploadResult = { ok: true; path: string } | { ok: false; error: string };

export async function uploadAvatarClient(userId: string, file: File): Promise<UploadResult> {
  const supabase = createClient();
  const objectPath = `avatars/${userId}/current.jpg`;

  const { error } = await supabase.storage.from("couple-media").upload(objectPath, file, {
    contentType: "image/jpeg",
    upsert: true,
  });

  if (error) {
    return { ok: false, error: "Не удалось загрузить аватар." };
  }

  return { ok: true, path: objectPath };
}

export async function uploadCoupleMediaClient(
  coupleId: string,
  userId: string,
  file: File,
): Promise<UploadResult> {
  const supabase = createClient();
  const extension = file.type.split("/")[1]?.replace("jpeg", "jpg") ?? "jpg";
  const objectPath = `${coupleId}/${userId}/${crypto.randomUUID()}.${extension}`;

  const { error } = await supabase.storage.from("couple-media").upload(objectPath, file, {
    contentType: file.type,
    upsert: false,
  });

  if (error) {
    return { ok: false, error: "Не удалось загрузить изображение." };
  }

  return { ok: true, path: objectPath };
}
