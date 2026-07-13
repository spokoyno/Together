"use server";

import { revalidatePath } from "next/cache";
import { requireUser } from "@/lib/auth/session";
import { actionError } from "@/lib/validation/forms";

export type OnboardingStep = "profile" | "invite" | "distance" | "done";

export type RelationshipDistance = "distance" | "nearby" | "together";

const DISTANCE_TO_DB: Record<RelationshipDistance, "long_distance" | "nearby" | "living_together"> = {
  distance: "long_distance",
  nearby: "nearby",
  together: "living_together",
};

export async function saveOnboardingProfile(displayName: string, birthday: string) {
  const { supabase, user } = await requireUser();

  const name = displayName.trim();
  if (!name) {
    return actionError("Укажите имя.");
  }

  if (!/^\d{4}-\d{2}-\d{2}$/.test(birthday)) {
    return actionError("Укажите корректную дату рождения.");
  }

  const { error } = await supabase
    .from("profiles")
    .update({
      display_name: name,
      birthday,
      onboarding_step: "invite",
      updated_at: new Date().toISOString(),
    })
    .eq("id", user.id);

  if (error) {
    return actionError("Не удалось сохранить профиль.");
  }

  revalidatePath("/onboarding");
  revalidatePath("/profile");
  return { ok: true as const };
}

export async function saveProfileStep(displayName: string) {
  const { supabase, user } = await requireUser();

  const name = displayName.trim();
  if (!name) {
    return actionError("Укажите имя.");
  }

  const { error } = await supabase
    .from("profiles")
    .update({
      display_name: name,
      onboarding_step: "invite",
      updated_at: new Date().toISOString(),
    })
    .eq("id", user.id);

  if (error) {
    return actionError("Не удалось сохранить профиль.");
  }

  revalidatePath("/onboarding");
  revalidatePath("/profile");
  return { ok: true as const };
}

export async function skipInviteStep() {
  return advanceOnboardingToDistance();
}

export async function advanceOnboardingToDistance() {
  const { supabase, user } = await requireUser();

  const { error } = await supabase
    .from("profiles")
    .update({
      onboarding_step: "distance",
      updated_at: new Date().toISOString(),
    })
    .eq("id", user.id);

  if (error) {
    return actionError("Не удалось продолжить.");
  }

  revalidatePath("/onboarding");
  return { ok: true as const };
}

export async function saveRelationshipDistance(distance: RelationshipDistance) {
  return saveDistanceStep(DISTANCE_TO_DB[distance]);
}

export async function saveDistanceStep(
  distance: "long_distance" | "nearby" | "living_together",
) {
  const { supabase, user } = await requireUser();

  const { error } = await supabase
    .from("profiles")
    .update({
      partner_distance: distance,
      onboarding_step: "done",
      updated_at: new Date().toISOString(),
    })
    .eq("id", user.id);

  if (error) {
    return actionError("Не удалось сохранить.");
  }

  revalidatePath("/onboarding");
  revalidatePath("/dashboard");
  return { ok: true as const };
}
