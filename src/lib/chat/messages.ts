import type { SupabaseClient } from "@supabase/supabase-js";
import type { ChatMessage } from "@/types/domain";

type MessageRow = {
  id: string;
  couple_id: string;
  sender_id: string;
  body: string;
  created_at: string;
  profiles: { display_name: string } | { display_name: string }[] | null;
};

export function mapMessageRow(row: MessageRow): ChatMessage {
  const rawProfile = row.profiles;
  const profile = Array.isArray(rawProfile) ? rawProfile[0] : rawProfile;

  return {
    id: row.id,
    coupleId: row.couple_id,
    senderId: row.sender_id,
    senderName: profile?.display_name ?? "Пользователь",
    body: row.body,
    createdAt: row.created_at,
  };
}

export async function getCoupleMessages(
  supabase: SupabaseClient,
  coupleId: string,
  limit = 50,
): Promise<ChatMessage[]> {
  const { data } = await supabase
    .from("messages")
    .select("id, couple_id, sender_id, body, created_at, profiles(display_name)")
    .eq("couple_id", coupleId)
    .order("created_at", { ascending: true })
    .limit(limit);

  return (data ?? []).map((row) => mapMessageRow(row as MessageRow));
}
