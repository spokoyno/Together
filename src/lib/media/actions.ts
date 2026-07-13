"use server";

import type { SupabaseClient } from "@supabase/supabase-js";
import { getAuthContext } from "@/lib/couple/context.server";
import { actionError } from "@/lib/validation/forms";

const MAX_BYTES = 5 * 1024 * 1024;
const ALLOWED_TYPES = new Set(["image/jpeg", "image/png", "image/webp", "image/gif"]);

export async function signMediaPath(path: string): Promise<string | null> {
  const { supabase } = await getAuthContext();

  const { data, error } = await supabase.storage
    .from("couple-media")
    .createSignedUrl(path, 60 * 60);

  if (error || !data?.signedUrl) {
    return null;
  }

  return data.signedUrl;
}

export async function signMediaPaths(
  supabase: SupabaseClient,
  paths: string[],
): Promise<Record<string, string>> {
  const unique = [...new Set(paths.filter(Boolean))];
  const entries = await Promise.all(
    unique.map(async (path) => {
      const { data } = await supabase.storage.from("couple-media").createSignedUrl(path, 60 * 60);
      return [path, data?.signedUrl ?? ""] as const;
    }),
  );

  return Object.fromEntries(entries.filter(([, url]) => url));
}

type UploadResult = { ok: true; path: string } | { ok: false; error: string };

export async function uploadCoupleImage(formData: FormData): Promise<UploadResult> {
  const { supabase, user, context } = await getAuthContext();

  if (!context?.isComplete) {
    return actionError("Загрузка доступна после подключения партнёра.");
  }

  const file = formData.get("file");
  if (!(file instanceof File) || file.size === 0) {
    return actionError("Выберите изображение.");
  }

  if (file.size > MAX_BYTES) {
    return actionError("Файл слишком большой (макс. 5 МБ).");
  }

  if (!ALLOWED_TYPES.has(file.type)) {
    return actionError("Поддерживаются только JPEG, PNG, WebP и GIF.");
  }

  const extension = file.type.split("/")[1]?.replace("jpeg", "jpg") ?? "jpg";
  const objectPath = `${context.coupleId}/${user.id}/${crypto.randomUUID()}.${extension}`;

  const { error } = await supabase.storage.from("couple-media").upload(objectPath, file, {
    contentType: file.type,
    upsert: false,
  });

  if (error) {
    return actionError("Не удалось загрузить изображение.");
  }

  return { ok: true, path: objectPath };
}
