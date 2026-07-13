import type { SupabaseClient } from "@supabase/supabase-js";
import { mapMessageRow } from "@/lib/chat/messages";
import { signMediaPaths } from "@/lib/media/actions";
import type { ChatNote, ChatSavedMessage } from "@/types/domain";

type MessageJoin = {
  id: string;
  couple_id: string;
  sender_id: string;
  body: string | null;
  image_path: string | null;
  created_at: string;
};

export async function getSavedMessageIds(
  supabase: SupabaseClient,
  userId: string,
  coupleId: string,
): Promise<string[]> {
  const { data } = await supabase
    .from("chat_saved_messages")
    .select("message_id")
    .eq("user_id", userId)
    .eq("couple_id", coupleId);

  return (data ?? []).map((row) => row.message_id);
}

export async function getSavedMessages(
  supabase: SupabaseClient,
  userId: string,
  coupleId: string,
  memberNames: Record<string, string>,
): Promise<ChatSavedMessage[]> {
  const { data } = await supabase
    .from("chat_saved_messages")
    .select("saved_at, messages(id, couple_id, sender_id, body, image_path, created_at)")
    .eq("user_id", userId)
    .eq("couple_id", coupleId)
    .order("saved_at", { ascending: false });

  const saved: ChatSavedMessage[] = [];
  const messageRows: MessageJoin[] = [];

  for (const row of data ?? []) {
    const rawMessage = row.messages as MessageJoin | MessageJoin[] | null;
    const message = Array.isArray(rawMessage) ? rawMessage[0] : rawMessage;
    if (!message) {
      continue;
    }
    messageRows.push(message);
  }

  const signedUrls = await signMediaPaths(
    supabase,
    messageRows.map((row) => row.image_path).filter((path): path is string => Boolean(path)),
  );

  for (const row of data ?? []) {
    const rawMessage = row.messages as MessageJoin | MessageJoin[] | null;
    const message = Array.isArray(rawMessage) ? rawMessage[0] : rawMessage;
    if (!message) {
      continue;
    }

    saved.push({
      ...mapMessageRow(message, memberNames, signedUrls),
      savedAt: row.saved_at,
    });
  }

  return saved;
}

export async function getChatNotes(
  supabase: SupabaseClient,
  userId: string,
  coupleId: string,
  memberNames: Record<string, string>,
): Promise<ChatNote[]> {
  const { data } = await supabase
    .from("chat_notes")
    .select(
      "id, couple_id, message_id, body, created_at, updated_at, messages(id, couple_id, sender_id, body, image_path, created_at)",
    )
    .eq("user_id", userId)
    .eq("couple_id", coupleId)
    .order("updated_at", { ascending: false });

  const notes = data ?? [];
  const linkedMessages = notes
    .map((row) => {
      const rawMessage = row.messages as MessageJoin | MessageJoin[] | null;
      return Array.isArray(rawMessage) ? rawMessage[0] : rawMessage;
    })
    .filter((message): message is MessageJoin => Boolean(message));

  const signedUrls = await signMediaPaths(
    supabase,
    linkedMessages.map((row) => row.image_path).filter((path): path is string => Boolean(path)),
  );

  return notes.map((row) => {
    const rawMessage = row.messages as MessageJoin | MessageJoin[] | null;
    const message = Array.isArray(rawMessage) ? rawMessage[0] : rawMessage;

    return {
      id: row.id,
      coupleId: row.couple_id,
      messageId: row.message_id,
      body: row.body,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
      linkedMessage: message ? mapMessageRow(message, memberNames, signedUrls) : null,
    };
  });
}
