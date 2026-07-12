import { createAdminClient } from "@/lib/supabase/admin";
import {
  configureWebPush,
  isExpiredPushError,
  sendWebPush,
  type PushSubscriptionRecord,
} from "@/lib/push/web-push";

type ChatPushInput = {
  partnerId: string;
  senderName: string;
  preview: string;
};

function buildPreview(body: string): string {
  const trimmed = body.trim();
  if (trimmed.length <= 120) {
    return trimmed;
  }

  return `${trimmed.slice(0, 117)}...`;
}

export function previewChatMessage(body: string): string {
  return buildPreview(body);
}

export async function sendChatPushNotification(input: ChatPushInput): Promise<void> {
  if (!configureWebPush()) {
    return;
  }

  const admin = createAdminClient();
  if (!admin) {
    return;
  }

  const { data: subscriptions, error } = await admin
    .from("push_subscriptions")
    .select("id, endpoint, p256dh, auth")
    .eq("user_id", input.partnerId);

  if (error || !subscriptions?.length) {
    return;
  }

  const payload = {
    title: "Together",
    body: `${input.senderName}: ${input.preview}`,
    url: "/chat",
    tag: "together-chat",
    badge: 1,
  };

  await Promise.all(
    subscriptions.map(async (subscription: PushSubscriptionRecord) => {
      try {
        await sendWebPush(subscription, payload);
      } catch (pushError) {
        if (isExpiredPushError(pushError)) {
          await admin.from("push_subscriptions").delete().eq("id", subscription.id);
        }
      }
    }),
  );
}
