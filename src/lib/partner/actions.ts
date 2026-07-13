"use server";

import { revalidatePath } from "next/cache";
import { getAuthContext } from "@/lib/couple/context.server";
import { actionError, nicknameSchema, parseFormData } from "@/lib/validation/forms";

export async function addPartnerNickname(formData: FormData) {
  const { supabase, user, context } = await getAuthContext();

  if (!context?.isComplete || !context.partner) {
    return actionError("Пара не подключена.");
  }

  const parsed = nicknameSchema.safeParse(parseFormData(formData));
  if (!parsed.success) {
    return actionError(parsed.error.issues[0]?.message ?? "Проверьте прозвище");
  }

  if (parsed.data.targetUserId !== context.partner.id) {
    return actionError("Некорректный получатель.");
  }

  const { error } = await supabase.from("partner_nicknames").insert({
    couple_id: context.coupleId,
    author_id: user.id,
    target_user_id: parsed.data.targetUserId,
    nickname: parsed.data.nickname,
  });

  if (error) {
    return actionError("Не удалось сохранить прозвище.");
  }

  const { error: profileError } = await supabase
    .from("profiles")
    .update({
      partner_nickname: parsed.data.nickname,
      updated_at: new Date().toISOString(),
    })
    .eq("id", user.id);

  if (profileError) {
    return actionError("Не удалось обновить отображаемое имя.");
  }

  revalidatePath("/profile/partner");
  revalidatePath("/chat");
  revalidatePath("/dashboard");
  return { ok: true as const };
}

export async function setNotificationsEnabled(enabled: boolean) {
  const { supabase, user } = await getAuthContext();

  const { error } = await supabase
    .from("profiles")
    .update({ notifications_enabled: enabled })
    .eq("id", user.id);

  if (error) {
    return actionError("Не удалось обновить настройки.");
  }

  revalidatePath("/profile");
  revalidatePath("/profile/partner");
  revalidatePath("/dashboard");
  return { ok: true as const };
}
