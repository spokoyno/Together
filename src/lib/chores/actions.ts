"use server";

import { revalidatePath } from "next/cache";
import type { SupabaseClient } from "@supabase/supabase-js";
import { getAuthContext } from "@/lib/couple/context.server";
import { actionError } from "@/lib/validation/forms";

export async function countChoresByUser(
  supabase: SupabaseClient,
  coupleId: string,
): Promise<Record<string, number>> {
  const { data: chores } = await supabase
    .from("household_chores")
    .select("completed_by")
    .eq("couple_id", coupleId)
    .eq("status", "done")
    .not("completed_by", "is", null);

  const counts: Record<string, number> = {};
  for (const chore of chores ?? []) {
    if (chore.completed_by) {
      counts[chore.completed_by] = (counts[chore.completed_by] ?? 0) + 1;
    }
  }

  return counts;
}

async function pickFairAssignee(
  supabase: SupabaseClient,
  coupleId: string,
  memberIds: string[],
): Promise<string> {
  if (memberIds.length === 1) {
    return memberIds[0]!;
  }

  const counts = await countChoresByUser(supabase, coupleId);

  let minCount = Infinity;
  const candidates: string[] = [];

  for (const memberId of memberIds) {
    const count = counts[memberId] ?? 0;
    if (count < minCount) {
      minCount = count;
      candidates.length = 0;
      candidates.push(memberId);
    } else if (count === minCount) {
      candidates.push(memberId);
    }
  }

  return candidates[Math.floor(Math.random() * candidates.length)]!;
}

export async function createChore(input: {
  title: string;
  dueDate?: string;
  assignedTo?: string | null;
}) {
  const { supabase, user, context } = await getAuthContext();
  if (!context?.isComplete) {
    return actionError("Пара не подключена.");
  }

  const title = input.title.trim();
  if (!title) {
    return actionError("Укажите название дела.");
  }

  const memberIds = context.members.map((member) => member.id);
  let assignedTo = input.assignedTo ?? null;

  if (assignedTo && !memberIds.includes(assignedTo)) {
    return actionError("Исполнитель должен быть участником пары.");
  }

  if (!assignedTo) {
    assignedTo = await pickFairAssignee(supabase, context.coupleId, memberIds);
  }

  const { error } = await supabase.from("household_chores").insert({
    couple_id: context.coupleId,
    created_by: user.id,
    title,
    due_date: input.dueDate || null,
    assigned_to: assignedTo,
  });

  if (error) {
    return actionError("Не удалось добавить дело.");
  }

  revalidatePath("/dashboard");
  revalidatePath("/memories/chores");
  return { ok: true as const };
}

export async function completeChore(choreId: string) {
  const { supabase, user, context } = await getAuthContext();
  if (!context?.isComplete) {
    return actionError("Пара не подключена.");
  }

  const { error } = await supabase
    .from("household_chores")
    .update({
      status: "done",
      completed_by: user.id,
      completed_at: new Date().toISOString(),
    })
    .eq("id", choreId)
    .eq("couple_id", context.coupleId);

  if (error) {
    return actionError("Не удалось отметить дело.");
  }

  revalidatePath("/dashboard");
  revalidatePath("/memories/chores");
  return { ok: true as const };
}
