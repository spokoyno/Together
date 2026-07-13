"use server";

import { revalidatePath } from "next/cache";
import { getAuthContext } from "@/lib/couple/context.server";
import { createInAppNotification } from "@/lib/notifications/actions";
import { MOOD_LABELS } from "@/lib/mood/labels";
import type { MoodLevel } from "@/types/domain";
import { moodSchema, parseFormData } from "@/lib/validation/forms";

export async function saveMood(formData: FormData): Promise<void> {
  const { supabase, user, context } = await getAuthContext();

  if (!context?.isComplete) {
    return;
  }

  const parsed = moodSchema.safeParse(parseFormData(formData));
  if (!parsed.success) {
    return;
  }

  const today = new Date().toISOString().slice(0, 10);

  await supabase
    .from("moods")
    .delete()
    .eq("couple_id", context.coupleId)
    .eq("user_id", user.id)
    .gte("created_at", `${today}T00:00:00`);

  const { error } = await supabase.from("moods").insert({
    couple_id: context.coupleId,
    user_id: user.id,
    level: parsed.data.level,
    energy: parsed.data.energy ?? null,
    note: parsed.data.note || null,
  });

  if (error) {
    return;
  }

  const partnerId = context.partner?.id;
  if (partnerId) {
    const level = parsed.data.level as MoodLevel;
    const { data: profile } = await supabase
      .from("profiles")
      .select("display_name")
      .eq("id", user.id)
      .maybeSingle();

    await createInAppNotification({
      supabase,
      coupleId: context.coupleId,
      userId: partnerId,
      type: "mood_change",
      title: "Настроение партнёра",
      body: `${profile?.display_name ?? "Партнёр"}: ${MOOD_LABELS[level]}`,
      linkPath: "/dashboard",
    });
  }

  revalidatePath("/mood");
  revalidatePath("/dashboard");
  revalidatePath("/profile");
}
