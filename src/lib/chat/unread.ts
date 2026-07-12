import type { SupabaseClient } from "@supabase/supabase-js";

export async function getUnreadChatCount(
  supabase: SupabaseClient,
  userId: string,
  coupleId: string,
): Promise<number> {
  const { data: readState } = await supabase
    .from("chat_read_state")
    .select("last_read_at")
    .eq("user_id", userId)
    .eq("couple_id", coupleId)
    .maybeSingle();

  const lastReadAt = readState?.last_read_at ?? "1970-01-01T00:00:00.000Z";

  const { count, error } = await supabase
    .from("messages")
    .select("id", { count: "exact", head: true })
    .eq("couple_id", coupleId)
    .neq("sender_id", userId)
    .gt("created_at", lastReadAt);

  if (error) {
    return 0;
  }

  return count ?? 0;
}

export async function markChatAsRead(
  supabase: SupabaseClient,
  userId: string,
  coupleId: string,
): Promise<void> {
  const { error } = await supabase.from("chat_read_state").upsert(
    {
      user_id: userId,
      couple_id: coupleId,
      last_read_at: new Date().toISOString(),
    },
    { onConflict: "user_id,couple_id" },
  );

  if (error) {
    return;
  }
}
