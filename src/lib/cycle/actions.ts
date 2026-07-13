"use server";

import { revalidatePath } from "next/cache";
import { getAuthContext } from "@/lib/couple/context.server";
import { actionError } from "@/lib/validation/forms";

export async function saveMenstrualCycle(input: {
  lastPeriodStart: string;
  cycleLengthDays: number;
  periodLengthDays: number;
}) {
  const { supabase, user, context } = await getAuthContext();
  if (!context?.isComplete) {
    return actionError("Пара не подключена.");
  }

  if (!/^\d{4}-\d{2}-\d{2}$/.test(input.lastPeriodStart)) {
    return actionError("Укажите дату начала цикла.");
  }

  if (input.cycleLengthDays < 20 || input.cycleLengthDays > 45) {
    return actionError("Длина цикла от 20 до 45 дней.");
  }

  if (input.periodLengthDays < 2 || input.periodLengthDays > 10) {
    return actionError("Длительность месячных от 2 до 10 дней.");
  }

  const { error } = await supabase.from("menstrual_cycles").upsert(
    {
      couple_id: context.coupleId,
      tracked_by: user.id,
      last_period_start: input.lastPeriodStart,
      cycle_length_days: input.cycleLengthDays,
      period_length_days: input.periodLengthDays,
      updated_at: new Date().toISOString(),
    },
    { onConflict: "couple_id" },
  );

  if (error) {
    return actionError("Не удалось сохранить.");
  }

  revalidatePath("/memories/cycle");
  revalidatePath("/dashboard");
  return { ok: true as const };
}
