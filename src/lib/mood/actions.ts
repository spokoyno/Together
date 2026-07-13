"use server";

import { revalidatePath } from "next/cache";
import { getAuthContext } from "@/lib/couple/context.server";
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

  revalidatePath("/mood");
  revalidatePath("/dashboard");
}
