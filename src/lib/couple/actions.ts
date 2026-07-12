"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireUser } from "@/lib/auth/session";
import { getCoupleContext } from "@/lib/couple/context";
import {
  actionError,
  createCoupleSchema,
  parseFormData,
} from "@/lib/validation/forms";

function getAppUrl() {
  return process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";
}

function mapCoupleError(message: string): string {
  if (message.includes("already_in_couple")) {
    return "Вы уже состоите в паре.";
  }
  if (message.includes("invalid_or_expired")) {
    return "Ссылка недействительна или истекла.";
  }
  if (message.includes("not_authenticated")) {
    return "Сначала войдите в аккаунт.";
  }
  if (message.includes("not_in_couple")) {
    return "Сначала создайте пару.";
  }
  if (message.includes("couple_complete")) {
    return "Партнёр уже подключён.";
  }
  if (message.includes("Could not find the function")) {
    return "Примените миграцию 004_create_couple_rpc.sql в Supabase SQL Editor.";
  }
  return "Не удалось выполнить действие. Проверьте миграции Supabase.";
}

type CreateCoupleResult =
  | { ok: true; inviteUrl: string }
  | { ok: false; error: string };

export async function createCouple(
  formData: FormData,
): Promise<CreateCoupleResult> {
  const { supabase, user } = await requireUser();
  const existing = await getCoupleContext(supabase, user.id);

  if (existing) {
    return actionError("Пара уже создана. Используйте кнопку ниже для новой ссылки.");
  }

  const parsed = createCoupleSchema.safeParse(parseFormData(formData));
  if (!parsed.success) {
    return actionError(parsed.error.issues[0]?.message ?? "Проверьте дату");
  }

  const { data, error } = await supabase.rpc("create_couple", {
    p_relationship_started_on: parsed.data.relationshipStartedOn,
  });

  if (error) {
    return actionError(mapCoupleError(error.message));
  }

  const payload = data as { invitation_token?: string } | null;
  const token = payload?.invitation_token;

  if (!token) {
    return actionError("Пара создана, но ссылка не получена. Создайте её кнопкой ниже.");
  }

  revalidatePath("/pair");
  revalidatePath("/dashboard");

  return {
    ok: true,
    inviteUrl: `${getAppUrl()}/invite/${token}`,
  };
}

export async function createInvitation(): Promise<
  { ok: true; inviteUrl: string } | { ok: false; error: string }
> {
  const { supabase, user } = await requireUser();
  const context = await getCoupleContext(supabase, user.id);

  if (!context) {
    return actionError("Сначала создайте пару.");
  }

  if (context.isComplete) {
    return actionError("Партнёр уже подключён.");
  }

  const { data, error } = await supabase.rpc("create_invitation");

  if (error) {
    return actionError(mapCoupleError(error.message));
  }

  const payload = data as { invitation_token?: string } | null;
  const token = payload?.invitation_token;

  if (!token) {
    return actionError("Не удалось создать приглашение.");
  }

  return { ok: true, inviteUrl: `${getAppUrl()}/invite/${token}` };
}

export async function acceptInvitation(token: string) {
  const { supabase } = await requireUser();

  const { data, error } = await supabase.rpc("accept_invitation", {
    invitation_token: token,
  });

  if (error) {
    return actionError(mapCoupleError(error.message));
  }

  if (!data) {
    return actionError(mapCoupleError("invalid_or_expired_invitation"));
  }

  revalidatePath("/dashboard");
  revalidatePath("/pair");
  redirect("/dashboard");
}

export async function leaveCouple(): Promise<void> {
  const { supabase } = await requireUser();
  const { error } = await supabase.rpc("leave_couple");

  if (error) {
    return;
  }

  revalidatePath("/profile");
  revalidatePath("/pair");
  redirect("/pair");
}

export async function updateRelationshipDate(formData: FormData): Promise<void> {
  const { supabase, user } = await requireUser();
  const context = await getCoupleContext(supabase, user.id);

  if (!context) {
    return;
  }

  const parsed = createCoupleSchema.safeParse(parseFormData(formData));
  if (!parsed.success) {
    return;
  }

  const { error } = await supabase
    .from("couples")
    .update({ relationship_started_on: parsed.data.relationshipStartedOn })
    .eq("id", context.coupleId);

  if (error) {
    return;
  }

  revalidatePath("/dashboard");
  revalidatePath("/profile");
}
