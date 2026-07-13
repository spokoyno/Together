import type { SupabaseClient } from "@supabase/supabase-js";
import { signMediaPaths } from "@/lib/media/actions";
import type { ChatMessage, ChatMessageReply } from "@/types/domain";

type MessageRow = {
  id: string;
  couple_id: string;
  sender_id: string;
  body: string | null;
  image_path: string | null;
  audio_path: string | null;
  reply_to_id: string | null;
  created_at: string;
};

type LikeRow = {
  message_id: string;
  user_id: string;
};

export async function enrichChatMessages(
  supabase: SupabaseClient,
  rows: MessageRow[],
  memberNames: Record<string, string>,
  userId: string,
): Promise<ChatMessage[]> {
  if (!rows.length) {
    return [];
  }

  const messageIds = rows.map((row) => row.id);
  const replyIds = [...new Set(rows.map((row) => row.reply_to_id).filter(Boolean))] as string[];

  const [likesResult, repliesResult] = await Promise.all([
    supabase.from("message_likes").select("message_id, user_id").in("message_id", messageIds),
    replyIds.length
      ? supabase
          .from("messages")
          .select("id, body, image_path, sender_id")
          .in("id", replyIds)
      : Promise.resolve({ data: [] as { id: string; body: string | null; image_path: string | null; sender_id: string }[] }),
  ]);

  const likeRows = (likesResult.data ?? []) as LikeRow[];
  const likeCountByMessage = new Map<string, number>();
  const likedByMe = new Set<string>();

  for (const like of likeRows) {
    likeCountByMessage.set(like.message_id, (likeCountByMessage.get(like.message_id) ?? 0) + 1);
    if (like.user_id === userId) {
      likedByMe.add(like.message_id);
    }
  }

  const replyById = new Map<string, ChatMessageReply>();
  for (const reply of repliesResult.data ?? []) {
    replyById.set(reply.id, {
      id: reply.id,
      body: reply.body,
      imagePath: reply.image_path,
      senderName: memberNames[reply.sender_id] ?? "User",
    });
  }

  const mediaPaths = rows.flatMap((row) =>
    [row.image_path, row.audio_path].filter((path): path is string => Boolean(path)),
  );
  const signedUrls = await signMediaPaths(supabase, mediaPaths);

  return rows.map((row) => ({
    id: row.id,
    coupleId: row.couple_id,
    senderId: row.sender_id,
    senderName: memberNames[row.sender_id] ?? "User",
    body: row.body,
    imagePath: row.image_path,
    imageUrl: row.image_path ? (signedUrls[row.image_path] ?? null) : null,
    audioPath: row.audio_path,
    audioUrl: row.audio_path ? (signedUrls[row.audio_path] ?? null) : null,
    replyToId: row.reply_to_id,
    replyTo: row.reply_to_id ? (replyById.get(row.reply_to_id) ?? null) : null,
    likeCount: likeCountByMessage.get(row.id) ?? 0,
    likedByMe: likedByMe.has(row.id),
    createdAt: row.created_at,
  }));
}

export const MESSAGE_SELECT =
  "id, couple_id, sender_id, body, image_path, audio_path, reply_to_id, created_at";

export type { MessageRow };
