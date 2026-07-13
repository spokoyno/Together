import type { SupabaseClient } from "@supabase/supabase-js";
import { signMediaPaths } from "@/lib/media/actions";
import type { ChatMessage } from "@/types/domain";

export const CHAT_PAGE_SIZE = 40;

type MessageRow = {
  id: string;
  couple_id: string;
  sender_id: string;
  body: string | null;
  image_path: string | null;
  created_at: string;
};

export type ChatMessagesPage = {
  messages: ChatMessage[];
  hasMore: boolean;
};

export function mapMessageRow(
  row: MessageRow,
  memberNames: Record<string, string>,
  signedUrls: Record<string, string>,
): ChatMessage {
  return {
    id: row.id,
    coupleId: row.couple_id,
    senderId: row.sender_id,
    senderName: memberNames[row.sender_id] ?? "Пользователь",
    body: row.body,
    imagePath: row.image_path,
    imageUrl: row.image_path ? signedUrls[row.image_path] ?? null : null,
    createdAt: row.created_at,
  };
}

async function mapPage(
  supabase: SupabaseClient,
  rows: MessageRow[],
  memberNames: Record<string, string>,
  pageSize: number,
): Promise<ChatMessagesPage> {
  const hasMore = rows.length > pageSize;
  const slice = hasMore ? rows.slice(0, pageSize) : rows;
  const signedUrls = await signMediaPaths(
    supabase,
    slice.map((row) => row.image_path).filter((path): path is string => Boolean(path)),
  );

  return {
    hasMore,
    messages: slice
      .slice()
      .reverse()
      .map((row) => mapMessageRow(row, memberNames, signedUrls)),
  };
}

export async function getRecentCoupleMessages(
  supabase: SupabaseClient,
  coupleId: string,
  memberNames: Record<string, string>,
  pageSize = CHAT_PAGE_SIZE,
): Promise<ChatMessagesPage> {
  const { data, error } = await supabase
    .from("messages")
    .select("id, couple_id, sender_id, body, image_path, created_at")
    .eq("couple_id", coupleId)
    .order("created_at", { ascending: false })
    .order("id", { ascending: false })
    .limit(pageSize + 1);

  if (error || !data) {
    return { messages: [], hasMore: false };
  }

  return mapPage(supabase, data, memberNames, pageSize);
}

export async function getOlderCoupleMessages(
  supabase: SupabaseClient,
  coupleId: string,
  memberNames: Record<string, string>,
  before: { createdAt: string; id: string },
  pageSize = CHAT_PAGE_SIZE,
): Promise<ChatMessagesPage> {
  const { data, error } = await supabase
    .from("messages")
    .select("id, couple_id, sender_id, body, image_path, created_at")
    .eq("couple_id", coupleId)
    .or(
      `created_at.lt."${before.createdAt}",and(created_at.eq."${before.createdAt}",id.lt.${before.id})`,
    )
    .order("created_at", { ascending: false })
    .order("id", { ascending: false })
    .limit(pageSize + 1);

  if (error || !data) {
    return { messages: [], hasMore: false };
  }

  return mapPage(supabase, data, memberNames, pageSize);
}

/** @deprecated Use getRecentCoupleMessages */
export async function getCoupleMessages(
  supabase: SupabaseClient,
  coupleId: string,
  memberNames: Record<string, string>,
): Promise<ChatMessage[]> {
  const page = await getRecentCoupleMessages(supabase, coupleId, memberNames);
  return page.messages;
}

export function prependMessages(
  current: ChatMessage[],
  older: ChatMessage[],
): ChatMessage[] {
  if (!older.length) {
    return current;
  }

  const ids = new Set(current.map((message) => message.id));
  const uniqueOlder = older.filter((message) => !ids.has(message.id));

  if (!uniqueOlder.length) {
    return current;
  }

  return [...uniqueOlder, ...current].sort(
    (a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime(),
  );
}

export function mergeMessages(current: ChatMessage[], incoming: ChatMessage): ChatMessage[] {
  if (current.some((message) => message.id === incoming.id)) {
    return current;
  }

  const withoutMatchedPending = incoming.senderId
    ? current.filter((message) => {
        if (message.sendStatus !== "sending" || message.senderId !== incoming.senderId) {
          return true;
        }

        const bodyMatch = (message.body ?? "") === (incoming.body ?? "");
        const imageMatch =
          Boolean(message.imagePath && incoming.imagePath && message.imagePath === incoming.imagePath) ||
          (!message.imagePath && !incoming.imagePath);

        return !(bodyMatch && imageMatch);
      })
    : current;

  return [...withoutMatchedPending, incoming].sort(
    (a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime(),
  );
}

export function replaceOptimisticMessage(
  current: ChatMessage[],
  clientId: string,
  next: ChatMessage | { sendStatus: "failed" },
): ChatMessage[] {
  return current
    .map((message) => {
      if (message.clientId !== clientId) {
        return message;
      }

      if ("sendStatus" in next && next.sendStatus === "failed" && !("id" in next)) {
        return { ...message, sendStatus: "failed" as const };
      }

      return next as ChatMessage;
    })
    .sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
}
