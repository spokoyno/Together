"use server";

import { revalidatePath } from "next/cache";
import { requireUser } from "@/lib/auth/session";
import { mapMessageRow } from "@/lib/chat/messages";
import { markChatAsRead } from "@/lib/chat/unread";
import { getCoupleContext } from "@/lib/couple/context";
import { previewChatMessage, sendChatPushNotification } from "@/lib/push/send-chat-push";
import { actionError, chatNoteSchema, messageSchema } from "@/lib/validation/forms";
import type { ActionResult, ChatMessage, ChatNote } from "@/types/domain";

type SendMessageResult = { ok: true; message: ChatMessage } | { ok: false; error: string };

export async function sendMessage(body: string): Promise<SendMessageResult> {
  const { supabase, user } = await requireUser();
  const context = await getCoupleContext(supabase, user.id);

  if (!context?.isComplete) {
    return actionError("Чат доступен после подключения партнёра.");
  }

  const parsed = messageSchema.safeParse({ body });
  if (!parsed.success) {
    return actionError(parsed.error.issues[0]?.message ?? "Проверьте сообщение");
  }

  const { data, error } = await supabase
    .from("messages")
    .insert({
      couple_id: context.coupleId,
      sender_id: user.id,
      body: parsed.data.body,
    })
    .select("id, couple_id, sender_id, body, created_at, profiles(display_name)")
    .single();

  if (error || !data) {
    return actionError("Не удалось отправить сообщение.");
  }

  const message = mapMessageRow(data);
  const senderName =
    context.members.find((member) => member.id === user.id)?.display_name ?? "Партнёр";

  if (context.partner) {
    try {
      await sendChatPushNotification({
        partnerId: context.partner.id,
        senderName,
        preview: previewChatMessage(parsed.data.body),
      });
    } catch {
      // Push must not block message delivery.
    }
  }

  revalidatePath("/chat");

  return {
    ok: true,
    message,
  };
}

export async function markChatRead(): Promise<void> {
  const { supabase, user } = await requireUser();
  const context = await getCoupleContext(supabase, user.id);

  if (!context?.isComplete) {
    return;
  }

  await markChatAsRead(supabase, user.id, context.coupleId);
  revalidatePath("/chat");
  revalidatePath("/dashboard", "layout");
}

export async function sendMessageForm(formData: FormData): Promise<ActionResult | void> {
  const body = formData.get("body");
  if (typeof body !== "string") {
    return actionError("Напишите сообщение");
  }

  const result = await sendMessage(body);
  if (!result.ok) {
    return result;
  }
}

type ToggleSaveResult = { ok: true; saved: boolean } | { ok: false; error: string };

export async function toggleSaveMessage(messageId: string): Promise<ToggleSaveResult> {
  const { supabase, user } = await requireUser();
  const context = await getCoupleContext(supabase, user.id);

  if (!context?.isComplete) {
    return actionError("Чат доступен после подключения партнёра.");
  }

  const { data: message } = await supabase
    .from("messages")
    .select("id")
    .eq("id", messageId)
    .eq("couple_id", context.coupleId)
    .maybeSingle();

  if (!message) {
    return actionError("Сообщение не найдено.");
  }

  const { data: existing } = await supabase
    .from("chat_saved_messages")
    .select("message_id")
    .eq("user_id", user.id)
    .eq("message_id", messageId)
    .maybeSingle();

  if (existing) {
    const { error } = await supabase
      .from("chat_saved_messages")
      .delete()
      .eq("user_id", user.id)
      .eq("message_id", messageId);

    if (error) {
      return actionError("Не удалось убрать из сохранённых.");
    }

    revalidatePath("/chat");
    return { ok: true, saved: false };
  }

  const { error } = await supabase.from("chat_saved_messages").insert({
    user_id: user.id,
    message_id: messageId,
    couple_id: context.coupleId,
  });

  if (error) {
    return actionError("Не удалось сохранить сообщение.");
  }

  revalidatePath("/chat");
  return { ok: true, saved: true };
}

type NoteResult = { ok: true; note: ChatNote } | { ok: false; error: string };

export async function createChatNote(
  body: string,
  messageId?: string | null,
): Promise<NoteResult> {
  const { supabase, user } = await requireUser();
  const context = await getCoupleContext(supabase, user.id);

  if (!context?.isComplete) {
    return actionError("Чат доступен после подключения партнёра.");
  }

  const parsed = chatNoteSchema.safeParse({ body, messageId: messageId ?? undefined });
  if (!parsed.success) {
    return actionError(parsed.error.issues[0]?.message ?? "Проверьте заметку");
  }

  if (parsed.data.messageId) {
    const { data: message } = await supabase
      .from("messages")
      .select("id")
      .eq("id", parsed.data.messageId)
      .eq("couple_id", context.coupleId)
      .maybeSingle();

    if (!message) {
      return actionError("Сообщение не найдено.");
    }
  }

  const { data, error } = await supabase
    .from("chat_notes")
    .insert({
      user_id: user.id,
      couple_id: context.coupleId,
      message_id: parsed.data.messageId ?? null,
      body: parsed.data.body,
    })
    .select("id, couple_id, message_id, body, created_at, updated_at")
    .single();

  if (error || !data) {
    return actionError("Не удалось создать заметку.");
  }

  revalidatePath("/chat");

  return {
    ok: true,
    note: {
      id: data.id,
      coupleId: data.couple_id,
      messageId: data.message_id,
      body: data.body,
      createdAt: data.created_at,
      updatedAt: data.updated_at,
      linkedMessage: null,
    },
  };
}

export async function updateChatNote(noteId: string, body: string): Promise<NoteResult> {
  const { supabase, user } = await requireUser();
  const parsed = chatNoteSchema.safeParse({ body });

  if (!parsed.success) {
    return actionError(parsed.error.issues[0]?.message ?? "Проверьте заметку");
  }

  const { data, error } = await supabase
    .from("chat_notes")
    .update({
      body: parsed.data.body,
      updated_at: new Date().toISOString(),
    })
    .eq("id", noteId)
    .eq("user_id", user.id)
    .select("id, couple_id, message_id, body, created_at, updated_at")
    .single();

  if (error || !data) {
    return actionError("Не удалось обновить заметку.");
  }

  revalidatePath("/chat");

  return {
    ok: true,
    note: {
      id: data.id,
      coupleId: data.couple_id,
      messageId: data.message_id,
      body: data.body,
      createdAt: data.created_at,
      updatedAt: data.updated_at,
      linkedMessage: null,
    },
  };
}

export async function deleteChatNote(noteId: string): Promise<ActionResult> {
  const { supabase, user } = await requireUser();

  const { error } = await supabase
    .from("chat_notes")
    .delete()
    .eq("id", noteId)
    .eq("user_id", user.id);

  if (error) {
    return actionError("Не удалось удалить заметку.");
  }

  revalidatePath("/chat");
  return { ok: true };
}
