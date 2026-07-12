"use server";

import { revalidatePath } from "next/cache";
import { requireUser } from "@/lib/auth/session";
import { getCoupleContext } from "@/lib/couple/context";
import {
  actionError,
  parseFormData,
  profileSchema,
} from "@/lib/validation/forms";

export async function updateProfile(formData: FormData): Promise<void> {
  const { supabase, user } = await requireUser();
  const parsed = profileSchema.safeParse(parseFormData(formData));

  if (!parsed.success) {
    return;
  }

  const { error } = await supabase
    .from("profiles")
    .update({
      display_name: parsed.data.displayName,
      updated_at: new Date().toISOString(),
    })
    .eq("id", user.id);

  if (error) {
    return;
  }

  if (parsed.data.relationshipStartedOn) {
    const context = await getCoupleContext(supabase, user.id);
    if (context) {
      await supabase
        .from("couples")
        .update({ relationship_started_on: parsed.data.relationshipStartedOn })
        .eq("id", context.coupleId);
    }
  }

  revalidatePath("/profile");
  revalidatePath("/dashboard");
}

export async function exportCoupleData() {
  const { supabase, user } = await requireUser();
  const context = await getCoupleContext(supabase, user.id);

  if (!context?.isComplete) {
    return actionError("Экспорт доступен после подключения партнёра.");
  }

  const coupleId = context.coupleId;

  const [profile, moods, plans, memories, events, answers] = await Promise.all([
    supabase.from("profiles").select("*").eq("id", user.id).single(),
    supabase.from("moods").select("*").eq("couple_id", coupleId).order("created_at"),
    supabase.from("plans").select("*").eq("couple_id", coupleId).order("created_at"),
    supabase.from("memories").select("*").eq("couple_id", coupleId).order("created_at"),
    supabase.from("events").select("*").eq("couple_id", coupleId).order("starts_at"),
    supabase
      .from("answers")
      .select("*, daily_questions(question_date, questions(prompt))")
      .eq("user_id", user.id),
  ]);

  const payload = {
    exported_at: new Date().toISOString(),
    profile: profile.data,
    moods: moods.data ?? [],
    plans: plans.data ?? [],
    memories: memories.data ?? [],
    events: events.data ?? [],
    answers: answers.data ?? [],
  };

  return { ok: true as const, json: JSON.stringify(payload, null, 2) };
}
