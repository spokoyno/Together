"use server";

import { revalidatePath } from "next/cache";
import { createChore as createChoreAction, completeChore as completeChoreAction } from "@/lib/chores/actions";
import { createCountdown as createCountdownAction, deleteCountdown as deleteCountdownAction } from "@/lib/countdown/actions";
import {
  completeHabit as completeHabitAction,
  createHabit as createHabitAction,
  setHabitMotivation as setHabitMotivationAction,
} from "@/lib/habits/actions";
import { completeTravel, createTravel } from "@/lib/travel/actions";

export async function addTravelDestination(country: string, description?: string, plannedDate?: string) {
  return createTravel({ country, description, plannedDate });
}

export async function markTravelDone(travelId: string) {
  const result = await completeTravel(travelId);
  if (result.ok) {
    revalidatePath("/memories/travel");
  }
  return result;
}

export async function addChore(title: string, dueDate?: string, assignedTo?: string | null) {
  const result = await createChoreAction({ title, dueDate, assignedTo });
  if (result.ok) {
    revalidatePath("/memories/chores");
  }
  return result;
}

export async function completeChore(choreId: string) {
  const result = await completeChoreAction(choreId);
  if (result.ok) {
    revalidatePath("/memories/chores");
  }
  return result;
}

export async function addCountdownEvent(title: string, eventDate: string) {
  const result = await createCountdownAction({ title, targetDate: eventDate, showOnDashboard: true });
  if (result.ok) {
    revalidatePath("/memories/countdown");
    revalidatePath("/dashboard");
  }
  return result;
}

export async function deleteCountdownEvent(eventId: string) {
  const result = await deleteCountdownAction(eventId);
  if (result.ok) {
    revalidatePath("/memories/countdown");
    revalidatePath("/dashboard");
  }
  return result;
}

export async function addCoupleHabit(title: string, description?: string, plannedDate?: string) {
  const result = await createHabitAction({ title, description, plannedDate });
  if (result.ok) {
    revalidatePath("/memories/habits");
  }
  return result;
}

export async function completeCoupleHabit(habitId: string) {
  const result = await completeHabitAction(habitId);
  if (result.ok) {
    revalidatePath("/memories/habits");
  }
  return result;
}

export async function setHabitMotivation(habitId: string, motivation: string) {
  const result = await setHabitMotivationAction(habitId, motivation);
  if (result.ok) {
    revalidatePath("/memories/habits");
  }
  return result;
}
