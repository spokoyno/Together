"use server";

import { revalidatePath } from "next/cache";
import { getAuthContext } from "@/lib/couple/context.server";
import { actionError } from "@/lib/validation/forms";

export async function createHabit(input: {
  title: string;
  description?: string;
  plannedDate?: string;
}) {
  const { supabase, user, context } = await getAuthContext();
  if (!context?.isComplete) {
    return actionError("Пара не подключена.");
  }

  const title = input.title.trim();
  if (!title) {
    return actionError("Укажите название привычки.");
  }

  const { error } = await supabase.from("habits").insert({
    couple_id: context.coupleId,
    created_by: user.id,
    title,
    description: input.description?.trim() || null,
    planned_date: input.plannedDate || null,
  });

  if (error) {
    return actionError("Не удалось добавить привычку.");
  }

  if (input.plannedDate) {
    await supabase.from("plans").insert({
      couple_id: context.coupleId,
      created_by: user.id,
      title: `Привычка: ${title}`,
      details: input.description?.trim() || null,
      category: "habit",
      due_at: new Date(`${input.plannedDate}T12:00:00`).toISOString(),
    });
  }

  revalidatePath("/dashboard");
  revalidatePath("/plans");
  revalidatePath("/memories/habits");
  return { ok: true as const };
}

export async function setHabitMotivation(habitId: string, motivation: string) {
  const { supabase, context } = await getAuthContext();
  if (!context?.isComplete) {
    return actionError("Пара не подключена.");
  }

  const text = motivation.trim();
  if (!text) {
    return actionError("Напишите мотивацию.");
  }

  const { error } = await supabase
    .from("habits")
    .update({ motivation: text.slice(0, 500) })
    .eq("id", habitId)
    .eq("couple_id", context.coupleId);

  if (error) {
    return actionError("Не удалось сохранить мотивацию.");
  }

  revalidatePath("/dashboard");
  return { ok: true as const };
}

export async function completeHabit(habitId: string) {
  const { supabase, context } = await getAuthContext();
  if (!context?.isComplete) {
    return actionError("Пара не подключена.");
  }

  const { error } = await supabase
    .from("habits")
    .update({ status: "completed" })
    .eq("id", habitId)
    .eq("couple_id", context.coupleId);

  if (error) {
    return actionError("Не удалось завершить привычку.");
  }

  revalidatePath("/dashboard");
  return { ok: true as const };
}
