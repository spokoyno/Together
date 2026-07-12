"use server";

import { revalidatePath } from "next/cache";
import { getAuthContext } from "@/lib/couple/context.server";
import { parseFormData, planSchema } from "@/lib/validation/forms";

export async function createPlan(formData: FormData): Promise<void> {
  const { supabase, user, context } = await getAuthContext();

  if (!context?.isComplete) {
    return;
  }

  const parsed = planSchema.safeParse(parseFormData(formData));
  if (!parsed.success) {
    return;
  }

  const { error } = await supabase.from("plans").insert({
    couple_id: context.coupleId,
    created_by: user.id,
    title: parsed.data.title,
    details: parsed.data.details || null,
    category: parsed.data.category,
    due_at: parsed.data.dueAt ? new Date(parsed.data.dueAt).toISOString() : null,
  });

  if (error) {
    return;
  }

  revalidatePath("/plans");
  revalidatePath("/dashboard");
}

export async function completePlan(planId: string): Promise<void> {
  const { supabase, context } = await getAuthContext();

  if (!context?.isComplete) {
    return;
  }

  const { error } = await supabase
    .from("plans")
    .update({
      status: "completed",
      completed_at: new Date().toISOString(),
    })
    .eq("id", planId)
    .eq("couple_id", context.coupleId);

  if (error) {
    return;
  }

  revalidatePath("/plans");
  revalidatePath("/dashboard");
}

export async function deletePlan(planId: string): Promise<void> {
  const { supabase, context } = await getAuthContext();

  if (!context?.isComplete) {
    return;
  }

  const { error } = await supabase
    .from("plans")
    .delete()
    .eq("id", planId)
    .eq("couple_id", context.coupleId);

  if (error) {
    return;
  }

  revalidatePath("/plans");
  revalidatePath("/dashboard");
}
