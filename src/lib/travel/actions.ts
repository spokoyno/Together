"use server";

import { revalidatePath } from "next/cache";
import { getAuthContext } from "@/lib/couple/context.server";
import { actionError } from "@/lib/validation/forms";

export async function createTravel(input: {
  country: string;
  description?: string;
  plannedDate?: string;
}) {
  const { supabase, user, context } = await getAuthContext();
  if (!context?.isComplete) {
    return actionError("Пара не подключена.");
  }

  const country = input.country.trim();
  if (!country) {
    return actionError("Укажите страну.");
  }

  const { error } = await supabase.from("travel_plans").insert({
    couple_id: context.coupleId,
    created_by: user.id,
    country,
    description: input.description?.trim() || null,
    planned_date: input.plannedDate || null,
  });

  if (error) {
    return actionError("Не удалось добавить поездку.");
  }

  if (input.plannedDate) {
    await supabase.from("plans").insert({
      couple_id: context.coupleId,
      created_by: user.id,
      title: `Поездка: ${country}`,
      details: input.description?.trim() || null,
      category: "travel",
      due_at: new Date(`${input.plannedDate}T12:00:00`).toISOString(),
    });
  }

  revalidatePath("/dashboard");
  revalidatePath("/memories/travel");
  revalidatePath("/plans");
  return { ok: true as const };
}

export async function completeTravel(travelId: string) {
  const { supabase, context } = await getAuthContext();
  if (!context?.isComplete) {
    return actionError("Пара не подключена.");
  }

  const { error } = await supabase
    .from("travel_plans")
    .update({
      status: "completed",
      completed_at: new Date().toISOString(),
    })
    .eq("id", travelId)
    .eq("couple_id", context.coupleId);

  if (error) {
    return actionError("Не удалось отметить поездку.");
  }

  revalidatePath("/dashboard");
  revalidatePath("/memories/travel");
  revalidatePath("/plans");
  return { ok: true as const };
}

export async function deleteTravel(travelId: string) {
  const { supabase, context } = await getAuthContext();
  if (!context?.isComplete) {
    return actionError("Пара не подключена.");
  }

  const { error } = await supabase
    .from("travel_plans")
    .delete()
    .eq("id", travelId)
    .eq("couple_id", context.coupleId);

  if (error) {
    return actionError("Не удалось удалить поездку.");
  }

  revalidatePath("/dashboard");
  revalidatePath("/memories/travel");
  revalidatePath("/plans");
  return { ok: true as const };
}
