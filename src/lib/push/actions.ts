"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { requireUser } from "@/lib/auth/session";
import { getPushServerConfig } from "@/lib/push/config";
import { configureWebPush, sendWebPush } from "@/lib/push/web-push";
import { actionError } from "@/lib/validation/forms";
import type { ActionResult } from "@/types/domain";

const pushSubscriptionSchema = z.object({
  endpoint: z.string().url(),
  p256dh: z.string().min(1),
  auth: z.string().min(1),
});

function mapSubscriptionError(message: string): string {
  const text = message.toLowerCase();

  if (text.includes("push_subscriptions") || text.includes("could not find the table")) {
    return "Таблица push_subscriptions не найдена. Выполните: npm run db:push";
  }

  return "Не удалось сохранить подписку.";
}

export async function getPushStatus(): Promise<{
  subscriptionCount: number;
  serverReady: boolean;
  vapidConfigured: boolean;
  serviceRoleConfigured: boolean;
}> {
  const { supabase, user } = await requireUser();
  const config = getPushServerConfig();

  const { count, error } = await supabase
    .from("push_subscriptions")
    .select("id", { count: "exact", head: true })
    .eq("user_id", user.id);

  if (error) {
    return {
      subscriptionCount: 0,
      serverReady: config.serverReady,
      vapidConfigured: config.vapidConfigured,
      serviceRoleConfigured: config.serviceRoleConfigured,
    };
  }

  return {
    subscriptionCount: count ?? 0,
    serverReady: config.serverReady,
    vapidConfigured: config.vapidConfigured,
    serviceRoleConfigured: config.serviceRoleConfigured,
  };
}

export async function savePushSubscription(input: {
  endpoint: string;
  p256dh: string;
  auth: string;
}): Promise<ActionResult> {
  const { supabase, user } = await requireUser();

  const parsed = pushSubscriptionSchema.safeParse(input);
  if (!parsed.success) {
    return actionError("Некорректная подписка на уведомления.");
  }

  const { error } = await supabase.from("push_subscriptions").upsert(
    {
      user_id: user.id,
      endpoint: parsed.data.endpoint,
      p256dh: parsed.data.p256dh,
      auth: parsed.data.auth,
    },
    { onConflict: "user_id,endpoint" },
  );

  if (error) {
    return actionError(mapSubscriptionError(error.message));
  }

  revalidatePath("/chat");
  revalidatePath("/profile");

  return { ok: true };
}

export async function removePushSubscription(endpoint: string): Promise<ActionResult> {
  const { supabase, user } = await requireUser();

  if (!endpoint) {
    return actionError("Подписка не найдена.");
  }

  const { error } = await supabase
    .from("push_subscriptions")
    .delete()
    .eq("user_id", user.id)
    .eq("endpoint", endpoint);

  if (error) {
    return actionError("Не удалось отключить уведомления.");
  }

  revalidatePath("/chat");
  revalidatePath("/profile");

  return { ok: true };
}

export async function sendTestPushNotification(): Promise<ActionResult> {
  const { supabase, user } = await requireUser();
  const config = getPushServerConfig();

  if (!config.vapidConfigured) {
    return actionError("VAPID ключи не настроены на сервере.");
  }

  if (!configureWebPush()) {
    return actionError("Не удалось инициализировать Web Push.");
  }

  const { data: subscriptions, error } = await supabase
    .from("push_subscriptions")
    .select("id, endpoint, p256dh, auth")
    .eq("user_id", user.id);

  if (error) {
    return actionError(mapSubscriptionError(error.message));
  }

  if (!subscriptions?.length) {
    return actionError("Подписка не найдена. Сначала включите уведомления.");
  }

  try {
    await Promise.all(
      subscriptions.map((subscription) =>
        sendWebPush(subscription, {
          title: "Together",
          body: "Тестовое уведомление. Всё работает!",
          url: "/chat",
          tag: "together-chat-test",
        }),
      ),
    );
  } catch {
    return actionError(
      "Не удалось отправить тест. Проверьте VAPID ключи в .env.local и на Vercel.",
    );
  }

  return { ok: true };
}
