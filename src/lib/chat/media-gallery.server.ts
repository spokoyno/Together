import type { SupabaseClient } from "@supabase/supabase-js";
import { enrichChatMessages, MESSAGE_SELECT, type MessageRow } from "@/lib/chat/message-meta";
import type { ChatMessage } from "@/types/domain";

export async function getChatMediaMessages(
  supabase: SupabaseClient,
  coupleId: string,
  memberNames: Record<string, string>,
  userId: string,
  limit = 120,
): Promise<ChatMessage[]> {
  const { data, error } = await supabase
    .from("messages")
    .select(MESSAGE_SELECT)
    .eq("couple_id", coupleId)
    .not("image_path", "is", null)
    .order("created_at", { ascending: false })
    .limit(limit);

  if (error || !data?.length) {
    return [];
  }

  return enrichChatMessages(supabase, data as MessageRow[], memberNames, userId);
}
