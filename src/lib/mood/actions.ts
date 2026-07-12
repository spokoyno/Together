"use server";

import { revalidatePath } from "next/cache";
import { requireUser } from "@/lib/auth/session";
import { getCoupleContext } from "@/lib/couple/context";
import { moodSchema, parseFormData } from "@/lib/validation/forms";

export async function saveMood(formData: FormData): Promise<void> {
  const { supabase, user } = await requireUser();
  const context = await getCoupleContext(supabase, user.id);

  if (!context?.isComplete) {
    return;
  }

  const parsed = moodSchema.safeParse(parseFormData(formData));
  if (!parsed.success) {
    return;
  }

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
