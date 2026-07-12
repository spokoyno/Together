import "server-only";

import { cache } from "react";
import type { SupabaseClient } from "@supabase/supabase-js";
import { getUnreadChatCount } from "@/lib/chat/unread";

export const getUnreadChatCountCached = cache(
  async (supabase: SupabaseClient, userId: string, coupleId: string) =>
    getUnreadChatCount(supabase, userId, coupleId),
);
