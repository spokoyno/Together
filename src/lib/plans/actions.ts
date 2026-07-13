"use server";

import { revalidatePath } from "next/cache";
import { getAuthContext } from "@/lib/couple/context.server";
import { actionError, parseFormData, planSchema } from "@/lib/validation/forms";

function parseRemindEnabled(formData: FormData): boolean {
  return formData.get("remindEnabled") === "on" || formData.get("remindEnabled") === "true";
}

export async function createPlan(formData: FormData): Promise<{ ok: boolean; error?: string }> {
  const { supabase, user, context } = await getAuthContext();

  if (!context?.isComplete) {
    return actionError("Пара не подключена.");
  }

  const parsed = planSchema.safeParse({
    ...parseFormData(formData),
    remindEnabled: parseRemindEnabled(formData),
  });

  if (!parsed.success) {
    return actionError(parsed.error.issues[0]?.message ?? "Проверьте поля");
  }

  const { error } = await supabase.from("plans").insert({
    couple_id: context.coupleId,
    created_by: user.id,
    title: parsed.data.title,
    details: parsed.data.details || null,
    category: parsed.data.category,
    due_at: parsed.data.dueAt ? new Date(parsed.data.dueAt).toISOString() : null,
    remind_enabled: parsed.data.remindEnabled ?? false,
  });

  if (error) {
    return actionError("Не удалось создать план.");
  }

  revalidatePath("/plans");
  revalidatePath("/dashboard");
  return { ok: true };
}

export async function completePlan(planId: string): Promise<void> {
  const { supabase, context } = await getAuthContext();

  if (!context?.isComplete) {
    return;
  }

  await supabase
    .from("plans")
    .update({
      status: "completed",
      completed_at: new Date().toISOString(),
    })
    .eq("id", planId)
    .eq("couple_id", context.coupleId);

  revalidatePath("/plans");
  revalidatePath("/dashboard");
}

export async function reschedulePlan(
  planId: string,
  dueAt: string,
): Promise<{ ok: boolean; error?: string }> {
  const { supabase, context } = await getAuthContext();

  if (!context?.isComplete) {
    return actionError("Пара не подключена.");
  }

  const parsedDate = new Date(dueAt);
  if (Number.isNaN(parsedDate.getTime())) {
    return actionError("Некорректная дата.");
  }

  const { error } = await supabase
    .from("plans")
    .update({
      due_at: parsedDate.toISOString(),
      status: "active",
      completed_at: null,
    })
    .eq("id", planId)
    .eq("couple_id", context.coupleId);

  if (error) {
    return actionError("Не удалось перенести план.");
  }

  revalidatePath("/plans");
  return { ok: true };
}

export async function deletePlan(planId: string): Promise<void> {
  const { supabase, context } = await getAuthContext();

  if (!context?.isComplete) {
    return;
  }

  await supabase.from("plans").delete().eq("id", planId).eq("couple_id", context.coupleId);

  revalidatePath("/plans");
  revalidatePath("/dashboard");
}
