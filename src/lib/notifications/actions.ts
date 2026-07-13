"use server";

import type { SupabaseClient } from "@supabase/supabase-js";

export type NotificationType = "tier_challenge" | "poll_invite" | "mood_change" | "event_reminder";

type CreateNotificationInput = {
  supabase: SupabaseClient;
  coupleId: string;
  userId: string;
  type: NotificationType;
  title: string;
  body?: string;
  linkPath?: string;
  referenceId?: string;
};

export async function createInAppNotification(input: CreateNotificationInput) {
  const { error } = await input.supabase.from("in_app_notifications").insert({
    couple_id: input.coupleId,
    user_id: input.userId,
    type: input.type,
    title: input.title,
    body: input.body ?? null,
    link_path: input.linkPath ?? null,
    reference_id: input.referenceId ?? null,
  });

  if (error) {
    return false;
  }

  return true;
}

export async function loadUnreadNotificationCount(supabase: SupabaseClient, userId: string) {
  const { count, error } = await supabase
    .from("in_app_notifications")
    .select("id", { count: "exact", head: true })
    .eq("user_id", userId)
    .is("read_at", null);

  if (error) {
    return 0;
  }

  return count ?? 0;
}

export async function markNotificationRead(notificationId: string) {
  const { getAuthContext } = await import("@/lib/couple/context.server");
  const { supabase, user } = await getAuthContext();

  await supabase
    .from("in_app_notifications")
    .update({ read_at: new Date().toISOString() })
    .eq("id", notificationId)
    .eq("user_id", user.id);

  return { ok: true as const };
}

export async function markAllNotificationsRead() {
  const { getAuthContext } = await import("@/lib/couple/context.server");
  const { supabase, user } = await getAuthContext();

  await supabase
    .from("in_app_notifications")
    .update({ read_at: new Date().toISOString() })
    .eq("user_id", user.id)
    .is("read_at", null);

  return { ok: true as const };
}

export async function loadNotifications(supabase: SupabaseClient, userId: string) {
  const { data } = await supabase
    .from("in_app_notifications")
    .select("id, type, title, body, link_path, reference_id, read_at, created_at")
    .eq("user_id", userId)
    .order("created_at", { ascending: false })
    .limit(50);

  return (
    data?.map((row) => ({
      id: row.id,
      type: row.type as NotificationType,
      title: row.title,
      body: row.body,
      link_path: row.link_path,
      reference_id: row.reference_id,
      read_at: row.read_at,
      created_at: row.created_at,
    })) ?? []
  );
}
