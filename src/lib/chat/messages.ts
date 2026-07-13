import type { SupabaseClient } from "@supabase/supabase-js";
import type { ChatMessage } from "@/types/domain";
import {
  enrichChatMessages,
  MESSAGE_SELECT,
  type MessageRow,
} from "@/lib/chat/message-meta";

export const CHAT_PAGE_SIZE = 40;

export type ChatMessagesPage = {
  messages: ChatMessage[];
  hasMore: boolean;
};

async function mapPage(
  supabase: SupabaseClient,
  rows: MessageRow[],
  memberNames: Record<string, string>,
  userId: string,
  pageSize: number,
): Promise<ChatMessagesPage> {
  const hasMore = rows.length > pageSize;
  const slice = hasMore ? rows.slice(0, pageSize) : rows;

  const messages = await enrichChatMessages(
    supabase,
    slice.slice().reverse(),
    memberNames,
    userId,
  );

  return {
    hasMore,
    messages,
  };
}

export async function getRecentCoupleMessages(
  supabase: SupabaseClient,
  coupleId: string,
  memberNames: Record<string, string>,
  userId: string,
  pageSize = CHAT_PAGE_SIZE,
): Promise<ChatMessagesPage> {
  const { data, error } = await supabase
    .from("messages")
    .select(MESSAGE_SELECT)
    .eq("couple_id", coupleId)
    .order("created_at", { ascending: false })
    .order("id", { ascending: false })
    .limit(pageSize + 1);

  if (error || !data) {
    return { messages: [], hasMore: false };
  }

  return mapPage(supabase, data as MessageRow[], memberNames, userId, pageSize);
}

export async function getOlderCoupleMessages(
  supabase: SupabaseClient,
  coupleId: string,
  memberNames: Record<string, string>,
  userId: string,
  before: { createdAt: string; id: string },
  pageSize = CHAT_PAGE_SIZE,
): Promise<ChatMessagesPage> {
  const { data, error } = await supabase
    .from("messages")
    .select(MESSAGE_SELECT)
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

  return mapPage(supabase, data as MessageRow[], memberNames, userId, pageSize);
}

/** @deprecated Use getRecentCoupleMessages */
export async function getCoupleMessages(
  supabase: SupabaseClient,
  coupleId: string,
  memberNames: Record<string, string>,
  userId: string,
): Promise<ChatMessage[]> {
  const page = await getRecentCoupleMessages(supabase, coupleId, memberNames, userId);
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

function pendingMatchesIncoming(pending: ChatMessage, incoming: ChatMessage): boolean {
  const bodyMatch = (pending.body ?? "") === (incoming.body ?? "");
  const imageMatch =
    Boolean(pending.imagePath && incoming.imagePath && pending.imagePath === incoming.imagePath) ||
    (!pending.imagePath && !incoming.imagePath);
  const audioMatch =
    Boolean(pending.audioPath && incoming.audioPath && pending.audioPath === incoming.audioPath) ||
    (!pending.audioPath && !incoming.audioPath);

  return bodyMatch && imageMatch && audioMatch;
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
        return !pendingMatchesIncoming(message, incoming);
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

export function updateMessageLike(
  current: ChatMessage[],
  messageId: string,
  likedByMe: boolean,
  likeCount: number,
): ChatMessage[] {
  return current.map((message) =>
    message.id === messageId ? { ...message, likedByMe, likeCount } : message,
  );
}
