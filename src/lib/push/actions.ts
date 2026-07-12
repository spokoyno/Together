"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { requireUser } from "@/lib/auth/session";
import { actionError } from "@/lib/validation/forms";
import type { ActionResult } from "@/types/domain";

const pushSubscriptionSchema = z.object({
  endpoint: z.string().url(),
  p256dh: z.string().min(1),
  auth: z.string().min(1),
});

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
    return actionError("Не удалось сохранить подписку.");
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
