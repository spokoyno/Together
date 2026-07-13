"use server";

import { revalidatePath } from "next/cache";
import { getAuthContext } from "@/lib/couple/context.server";
import { actionError } from "@/lib/validation/forms";

export async function createCountdown(input: {
  title: string;
  targetDate: string;
  showOnDashboard?: boolean;
}) {
  const { supabase, user, context } = await getAuthContext();
  if (!context?.isComplete) {
    return actionError("Пара не подключена.");
  }

  const title = input.title.trim();
  if (!title) {
    return actionError("Укажите название.");
  }

  if (!/^\d{4}-\d{2}-\d{2}$/.test(input.targetDate)) {
    return actionError("Укажите корректную дату.");
  }

  const { error } = await supabase.from("countdown_events").insert({
    couple_id: context.coupleId,
    created_by: user.id,
    title,
    target_date: input.targetDate,
    show_on_dashboard: input.showOnDashboard ?? true,
  });

  if (error) {
    return actionError("Не удалось создать отсчёт.");
  }

  revalidatePath("/dashboard");
  return { ok: true as const };
}

export async function deleteCountdown(countdownId: string) {
  const { supabase, context } = await getAuthContext();
  if (!context?.isComplete) {
    return actionError("Пара не подключена.");
  }

  const { error } = await supabase
    .from("countdown_events")
    .delete()
    .eq("id", countdownId)
    .eq("couple_id", context.coupleId);

  if (error) {
    return actionError("Не удалось удалить отсчёт.");
  }

  revalidatePath("/dashboard");
  return { ok: true as const };
}
