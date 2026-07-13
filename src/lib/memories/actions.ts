"use server";

import { revalidatePath } from "next/cache";
import { getAuthContext } from "@/lib/couple/context.server";
import { uploadCoupleImage } from "@/lib/media/actions";
import {
  eventSchema,
  memorySchema,
  momentTypeSchema,
  parseFormData,
} from "@/lib/validation/forms";
import type { MomentMeta } from "@/types/domain";
import { actionError } from "@/lib/validation/forms";

function parseMeta(raw: string | undefined): MomentMeta {
  if (!raw) {
    return {};
  }

  try {
    return JSON.parse(raw) as MomentMeta;
  } catch {
    return {};
  }
}

export async function createMoment(formData: FormData) {
  const { supabase, user, context } = await getAuthContext();

  if (!context?.isComplete) {
    return actionError("Пара не подключена.");
  }

  const parsed = memorySchema.safeParse(parseFormData(formData));
  if (!parsed.success) {
    return actionError(parsed.error.issues[0]?.message ?? "Проверьте поля");
  }

  const momentType = momentTypeSchema.safeParse(parsed.data.momentType);
  if (!momentType.success) {
    return actionError("Некорректный тип момента.");
  }

  const meta = parseMeta(parsed.data.meta);
  const mediaFile = formData.get("mediaFile");

  let mediaPath: string | null = null;

  if (mediaFile instanceof File && mediaFile.size > 0) {
    const uploadData = new FormData();
    uploadData.set("file", mediaFile);
    const uploaded = await uploadCoupleImage(uploadData);
    if (!uploaded.ok) {
      return uploaded;
    }
    mediaPath = uploaded.path;
  }

  const title =
    parsed.data.title ||
    meta.movieTitle ||
    (momentType.data === "cooking" ? "Совместная кулинария" : null);

  if (!title && !parsed.data.body && !mediaPath) {
    return actionError("Добавьте описание или фото.");
  }

  const tags =
    parsed.data.tags
      ?.split(",")
      .map((tag) => tag.trim())
      .filter(Boolean) ?? [];

  const { error } = await supabase.from("memories").insert({
    couple_id: context.coupleId,
    created_by: user.id,
    title,
    body: parsed.data.body || null,
    happened_on: parsed.data.happenedOn || new Date().toISOString().slice(0, 10),
    media_path: mediaPath,
    tags,
    moment_type: momentType.data,
    meta,
  });

  if (error) {
    return actionError("Не удалось сохранить момент.");
  }

  revalidatePath("/memories");
  revalidatePath("/dashboard");
  return { ok: true as const };
}

export async function rateMoment(
  memoryId: string,
  rating: number,
): Promise<{ ok: boolean; error?: string }> {
  const { supabase, user, context } = await getAuthContext();

  if (!context?.isComplete) {
    return actionError("Пара не подключена.");
  }

  if (rating < 1 || rating > 10) {
    return actionError("Рейтинг от 1 до 10.");
  }

  const { data: memory } = await supabase
    .from("memories")
    .select("id, meta")
    .eq("id", memoryId)
    .eq("couple_id", context.coupleId)
    .maybeSingle();

  if (!memory) {
    return actionError("Момент не найден.");
  }

  const meta = (memory.meta ?? {}) as MomentMeta;
  const ratings = { ...(meta.ratings ?? {}), [user.id]: rating };

  const { error } = await supabase
    .from("memories")
    .update({ meta: { ...meta, ratings } })
    .eq("id", memoryId)
    .eq("couple_id", context.coupleId);

  if (error) {
    return actionError("Не удалось сохранить рейтинг.");
  }

  revalidatePath("/memories");
  return { ok: true };
}

export async function deleteMemory(memoryId: string): Promise<void> {
  const { supabase, context } = await getAuthContext();

  if (!context?.isComplete) {
    return;
  }

  await supabase.from("memories").delete().eq("id", memoryId).eq("couple_id", context.coupleId);

  revalidatePath("/memories");
  revalidatePath("/dashboard");
}

export async function createEvent(formData: FormData): Promise<void> {
  const { supabase, user, context } = await getAuthContext();

  if (!context?.isComplete) {
    return;
  }

  const parsed = eventSchema.safeParse(parseFormData(formData));
  if (!parsed.success) {
    return;
  }

  const { error } = await supabase.from("events").insert({
    couple_id: context.coupleId,
    created_by: user.id,
    title: parsed.data.title,
    starts_at: new Date(parsed.data.startsAt).toISOString(),
  });

  if (error) {
    return;
  }

  revalidatePath("/events");
  revalidatePath("/dashboard");
}

export async function deleteEvent(eventId: string): Promise<void> {
  const { supabase, context } = await getAuthContext();

  if (!context?.isComplete) {
    return;
  }

  await supabase.from("events").delete().eq("id", eventId).eq("couple_id", context.coupleId);

  revalidatePath("/events");
  revalidatePath("/dashboard");
}

/** @deprecated use createMoment */
export async function createMemory(formData: FormData): Promise<void> {
  await createMoment(formData);
}
