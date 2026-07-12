"use server";

import { revalidatePath } from "next/cache";
import { requireUser } from "@/lib/auth/session";
import { mapMessageRow } from "@/lib/chat/messages";
import { getCoupleContext } from "@/lib/couple/context";
import { actionError, messageSchema } from "@/lib/validation/forms";
import type { ActionResult, ChatMessage } from "@/types/domain";

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

  revalidatePath("/chat");

  return {
    ok: true,
    message: mapMessageRow(data),
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
