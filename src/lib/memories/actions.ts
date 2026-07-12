"use server";

import { revalidatePath } from "next/cache";
import { requireUser } from "@/lib/auth/session";
import { getCoupleContext } from "@/lib/couple/context";
import {
  eventSchema,
  memorySchema,
  parseFormData,
} from "@/lib/validation/forms";

export async function createMemory(formData: FormData): Promise<void> {
  const { supabase, user } = await requireUser();
  const context = await getCoupleContext(supabase, user.id);

  if (!context?.isComplete) {
    return;
  }

  const parsed = memorySchema.safeParse(parseFormData(formData));
  if (!parsed.success) {
    return;
  }

  if (!parsed.data.title && !parsed.data.body) {
    return;
  }

  const tags =
    parsed.data.tags
      ?.split(",")
      .map((tag) => tag.trim())
      .filter(Boolean) ?? [];

  const { error } = await supabase.from("memories").insert({
    couple_id: context.coupleId,
    created_by: user.id,
    title: parsed.data.title || null,
    body: parsed.data.body || null,
    happened_on: parsed.data.happenedOn || null,
    tags,
  });

  if (error) {
    return;
  }

  revalidatePath("/memories");
  revalidatePath("/dashboard");
}

export async function deleteMemory(memoryId: string): Promise<void> {
  const { supabase, user } = await requireUser();
  const context = await getCoupleContext(supabase, user.id);

  if (!context?.isComplete) {
    return;
  }

  const { error } = await supabase
    .from("memories")
    .delete()
    .eq("id", memoryId)
    .eq("couple_id", context.coupleId);

  if (error) {
    return;
  }

  revalidatePath("/memories");
  revalidatePath("/dashboard");
}

export async function createEvent(formData: FormData): Promise<void> {
  const { supabase, user } = await requireUser();
  const context = await getCoupleContext(supabase, user.id);

  if (!context?.isComplete) {
    return;
  }

  const parsed = eventSchema.safeParse(parseFormData(formData));
  if (!parsed.success) {
    return;
  }

  const { error } = await supabase.from("events").insert({
    couple_id: context.coupleId,
    created_by: user.id,
    title: parsed.data.title,
    starts_at: new Date(parsed.data.startsAt).toISOString(),
  });

  if (error) {
    return;
  }

  revalidatePath("/events");
  revalidatePath("/dashboard");
}

export async function deleteEvent(eventId: string): Promise<void> {
  const { supabase, user } = await requireUser();
  const context = await getCoupleContext(supabase, user.id);

  if (!context?.isComplete) {
    return;
  }

  const { error } = await supabase
    .from("events")
    .delete()
    .eq("id", eventId)
    .eq("couple_id", context.coupleId);

  if (error) {
    return;
  }

  revalidatePath("/events");
  revalidatePath("/dashboard");
}
