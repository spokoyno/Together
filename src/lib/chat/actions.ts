"use server";

import { mapMessageSendError } from "@/lib/chat/errors";
import { getOlderCoupleMessages } from "@/lib/chat/messages";
import { markChatAsRead } from "@/lib/chat/unread";
import { getAuthContext } from "@/lib/couple/context.server";
import { previewChatMessage, sendChatPushNotification } from "@/lib/push/send-chat-push";
import { actionError, chatNoteSchema, messageSchema } from "@/lib/validation/forms";
import type { ActionResult, ChatMessage, ChatNote } from "@/types/domain";

type SendMessageResult = { ok: true; message: ChatMessage } | { ok: false; error: string };

export async function sendMessage(body: string): Promise<SendMessageResult> {
  const { supabase, user, context } = await getAuthContext();

  if (!context?.isComplete) {
    return actionError("Чат доступен после подключения партнёра.");
  }

  const parsed = messageSchema.safeParse({ body });
  if (!parsed.success) {
    return actionError(parsed.error.issues[0]?.message ?? "Проверьте сообщение");
  }

  const { data, error: insertError } = await supabase
    .from("messages")
    .insert({
      couple_id: context.coupleId,
      sender_id: user.id,
      body: parsed.data.body,
    })
    .select("id, couple_id, sender_id, body, created_at")
    .single();

  if (insertError || !data) {
    return actionError(mapMessageSendError(insertError));
  }

  const senderName =
    context.members.find((member) => member.id === user.id)?.display_name ?? "Вы";

  const message: ChatMessage = {
    id: data.id,
    coupleId: data.couple_id,
    senderId: data.sender_id,
    senderName,
    body: data.body,
    createdAt: data.created_at,
  };

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

  return {
    ok: true,
    message,
  };
}

export async function markChatRead(): Promise<void> {
  const { supabase, user, context } = await getAuthContext();

  if (!context?.isComplete) {
    return;
  }

  await markChatAsRead(supabase, user.id, context.coupleId);
}

type LoadOlderResult =
  | { ok: true; messages: ChatMessage[]; hasMore: boolean }
  | { ok: false; error: string };

export async function loadOlderMessages(
  beforeCreatedAt: string,
  beforeId: string,
): Promise<LoadOlderResult> {
  const { supabase, context } = await getAuthContext();

  if (!context?.isComplete) {
    return actionError("Чат доступен после подключения партнёра.");
  }

  const memberNames = Object.fromEntries(
    context.members.map((member) => [member.id, member.display_name]),
  );

  const page = await getOlderCoupleMessages(
    supabase,
    context.coupleId,
    memberNames,
    { createdAt: beforeCreatedAt, id: beforeId },
  );

  return {
    ok: true,
    messages: page.messages,
    hasMore: page.hasMore,
  };
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
  const { supabase, user, context } = await getAuthContext();

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

  return { ok: true, saved: true };
}

type NoteResult = { ok: true; note: ChatNote } | { ok: false; error: string };

export async function createChatNote(
  body: string,
  messageId?: string | null,
): Promise<NoteResult> {
  const { supabase, user, context } = await getAuthContext();

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
  const { supabase, user } = await getAuthContext();
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
  const { supabase, user } = await getAuthContext();

  const { error } = await supabase
    .from("chat_notes")
    .delete()
    .eq("id", noteId)
    .eq("user_id", user.id);

  if (error) {
    return actionError("Не удалось удалить заметку.");
  }

  return { ok: true };
}
