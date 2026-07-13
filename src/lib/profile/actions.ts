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

const MAX_AVATAR_BYTES = 2 * 1024 * 1024;
const ALLOWED_AVATAR_TYPES = new Set(["image/jpeg", "image/png", "image/webp"]);

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

export async function uploadAvatar(formData: FormData): Promise<UploadAvatarResult> {
  const { supabase, user } = await requireUser();

  const file = formData.get("file");
  if (!(file instanceof File) || file.size === 0) {
    return actionError("Выберите изображение.");
  }

  if (file.size > MAX_AVATAR_BYTES) {
    return actionError("Аватар слишком большой (макс. 2 МБ).");
  }

  if (!ALLOWED_AVATAR_TYPES.has(file.type)) {
    return actionError("Поддерживаются JPEG, PNG и WebP.");
  }

  const extension = file.type.split("/")[1]?.replace("jpeg", "jpg") ?? "jpg";
  const objectPath = `avatars/${user.id}/current.${extension}`;

  const { data: profile } = await supabase
    .from("profiles")
    .select("avatar_path")
    .eq("id", user.id)
    .single();

  if (profile?.avatar_path && profile.avatar_path !== objectPath) {
    await supabase.storage.from("couple-media").remove([profile.avatar_path]);
  }

  const { error: uploadError } = await supabase.storage
    .from("couple-media")
    .upload(objectPath, file, {
      contentType: file.type,
      upsert: true,
    });

  if (uploadError) {
    return actionError("Не удалось загрузить аватар.");
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
