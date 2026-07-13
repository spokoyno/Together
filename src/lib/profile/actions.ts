"use server";

import { revalidatePath } from "next/cache";
import { requireUser } from "@/lib/auth/session";
import { getAuthContext, getCoupleContextForUser } from "@/lib/couple/context.server";
import { signMediaPath } from "@/lib/media/actions";
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
    const context = await getCoupleContextForUser(user.id);
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

type UploadAvatarResult =
  | { ok: true; avatarUrl: string | null }
  | { ok: false; error: string };

export async function saveAvatarPath(objectPath: string): Promise<UploadAvatarResult> {
  const { supabase, user } = await requireUser();

  const expectedPrefix = `avatars/${user.id}/`;
  if (!objectPath.startsWith(expectedPrefix)) {
    return actionError("Некорректный путь аватара.");
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("avatar_path")
    .eq("id", user.id)
    .single();

  if (profile?.avatar_path && profile.avatar_path !== objectPath) {
    await supabase.storage.from("couple-media").remove([profile.avatar_path]);
  }

  const { error: updateError } = await supabase
    .from("profiles")
    .update({
      avatar_path: objectPath,
      updated_at: new Date().toISOString(),
    })
    .eq("id", user.id);

  if (updateError) {
    return actionError("Не удалось сохранить аватар.");
  }

  revalidatePath("/profile");
  revalidatePath("/profile/partner");
  revalidatePath("/chat");
  revalidatePath("/dashboard");

  const avatarUrl = await signMediaPath(objectPath);
  return { ok: true, avatarUrl };
}

export async function exportCoupleData() {
  const { supabase, user, context } = await getAuthContext();

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

export async function saveBirthday(birthday: string) {
  const { supabase, user } = await requireUser();

  if (!/^\d{4}-\d{2}-\d{2}$/.test(birthday)) {
    return actionError("Укажите корректную дату.");
  }

  const { error } = await supabase
    .from("profiles")
    .update({
      birthday,
      updated_at: new Date().toISOString(),
    })
    .eq("id", user.id);

  if (error) {
    return actionError("Не удалось сохранить дату рождения.");
  }

  revalidatePath("/dashboard");
  revalidatePath("/plans");
  revalidatePath("/onboarding/birthday");
  return { ok: true as const };
}
