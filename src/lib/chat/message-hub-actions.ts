"use server";

import { revalidatePath } from "next/cache";
import { getAuthContext } from "@/lib/couple/context.server";
import { actionError } from "@/lib/validation/forms";

type HubActionResult = { ok: false; error: string } | { ok: true };

type LoadedMessage =
  | { ok: false; error: string }
  | {
      ok: true;
      supabase: Awaited<ReturnType<typeof getAuthContext>>["supabase"];
      user: Awaited<ReturnType<typeof getAuthContext>>["user"];
      context: NonNullable<Awaited<ReturnType<typeof getAuthContext>>["context"]>;
      message: {
        id: string;
        body: string | null;
        image_path: string | null;
        created_at: string;
      };
    };

async function loadMessage(messageId: string): Promise<LoadedMessage> {
  const { supabase, user, context } = await getAuthContext();
  if (!context?.isComplete) {
    return { ok: false, error: "Пара не подключена." };
  }

  const { data: message } = await supabase
    .from("messages")
    .select("id, body, image_path, created_at")
    .eq("id", messageId)
    .eq("couple_id", context.coupleId)
    .maybeSingle();

  if (!message) {
    return { ok: false, error: "Сообщение не найдено." };
  }

  return { ok: true, supabase, user, context, message };
}

function messageTitle(body: string | null, fallback: string) {
  const text = body?.trim();
  if (!text) {
    return fallback;
  }
  return text.slice(0, 160);
}

export async function addMessageToPlan(messageId: string, dueAt: string): Promise<HubActionResult> {
  const loaded = await loadMessage(messageId);
  if (!loaded.ok) {
    return actionError(loaded.error);
  }

  const parsedDate = new Date(dueAt);
  if (Number.isNaN(parsedDate.getTime())) {
    return actionError("Некорректная дата.");
  }

  const { supabase, user, context, message } = loaded;
  const title = messageTitle(message.body, "План из чата");

  const { error } = await supabase.from("plans").insert({
    couple_id: context.coupleId,
    created_by: user.id,
    title,
    details: message.body,
    due_at: parsedDate.toISOString(),
    category: "other",
  });

  if (error) {
    return actionError("Не удалось добавить в планы.");
  }

  revalidatePath("/plans");
  revalidatePath("/dashboard");
  return { ok: true as const };
}

export async function addMessageToMemories(messageId: string): Promise<HubActionResult> {
  const loaded = await loadMessage(messageId);
  if (!loaded.ok) {
    return actionError(loaded.error);
  }

  const { supabase, user, context, message } = loaded;

  if (!message.body && !message.image_path) {
    return actionError("В сообщении нет текста или фото.");
  }

  const { error } = await supabase.from("memories").insert({
    couple_id: context.coupleId,
    created_by: user.id,
    title: messageTitle(message.body, "Момент из чата"),
    body: message.body,
    media_path: message.image_path,
    moment_type: message.image_path ? "photo" : "memory",
    happened_on: message.created_at.slice(0, 10),
  });

  if (error) {
    return actionError("Не удалось добавить в воспоминания.");
  }

  revalidatePath("/memories");
  return { ok: true as const };
}

export async function addMessageToWatchlist(messageId: string): Promise<HubActionResult> {
  const loaded = await loadMessage(messageId);
  if (!loaded.ok) {
    return actionError(loaded.error);
  }

  const { supabase, user, context, message } = loaded;
  const title = messageTitle(message.body, "Фильм из чата");

  const { error } = await supabase.from("movie_entries").insert({
    couple_id: context.coupleId,
    added_by: user.id,
    tmdb_id: null,
    title,
    poster_path: null,
    status: "want",
    ratings: {},
    source_message_id: message.id,
  });

  if (error) {
    return actionError("Не удалось добавить в список просмотра.");
  }

  revalidatePath("/memories/movies");
  return { ok: true as const };
}

export async function addMessageToCooking(messageId: string): Promise<HubActionResult> {
  const loaded = await loadMessage(messageId);
  if (!loaded.ok) {
    return actionError(loaded.error);
  }

  const { supabase, user, context, message } = loaded;
  const title = messageTitle(message.body, "Блюдо из чата");

  const { error } = await supabase.from("cooking_dishes").insert({
    couple_id: context.coupleId,
    created_by: user.id,
    title,
    recipe: message.body && message.body.length > title.length ? message.body : null,
    media_path: message.image_path,
    status: "planned",
  });

  if (error) {
    return actionError("Не удалось добавить в готовку.");
  }

  revalidatePath("/memories");
  return { ok: true as const };
}
