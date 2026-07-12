"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireUser } from "@/lib/auth/session";
import { getAppUrl } from "@/lib/config/app-url";
import { getAuthContext } from "@/lib/couple/context.server";
import {
  actionError,
  createCoupleSchema,
  parseFormData,
} from "@/lib/validation/forms";
import type { ActionResult } from "@/types/domain";

function mapCoupleError(message: string, details?: string): string {
  const text = `${message} ${details ?? ""}`.toLowerCase();

  if (text.includes("already_in_couple")) {
    return "Вы уже состоите в паре.";
  }
  if (text.includes("invalid_or_expired")) {
    return "Ссылка недействительна или истекла.";
  }
  if (text.includes("not_authenticated")) {
    return "Сессия истекла. Войдите снова.";
  }
  if (text.includes("not_in_couple")) {
    return "Вы не состоите в паре.";
  }
  if (text.includes("couple_complete")) {
    return "Сначала отвяжите текущую пару в профиле.";
  }
  if (text.includes("couple_full")) {
    return "В эту пару уже подключён партнёр.";
  }
  if (text.includes("could not find the function")) {
    return "Миграции не применены. Выполните: npm run db:push";
  }
  if (text.includes("duplicate key")) {
    return "Пара уже создана. Обновите страницу.";
  }

  return `Ошибка: ${message}`;
}

type CreateCoupleResult = { ok: true } | { ok: false; error: string };

export async function createCouple(formData: FormData): Promise<CreateCoupleResult> {
  const { supabase } = await requireUser();

  const parsed = createCoupleSchema.safeParse(parseFormData(formData));
  if (!parsed.success) {
    return actionError(parsed.error.issues[0]?.message ?? "Проверьте дату");
  }

  const { data, error } = await supabase.rpc("create_couple", {
    p_relationship_started_on: parsed.data.relationshipStartedOn,
  });

  if (error) {
    return actionError(mapCoupleError(error.message, error.details));
  }

  const payload = data as { invitation_token?: string } | null;
  if (!payload?.invitation_token) {
    return actionError("Не удалось создать пару. Попробуйте ещё раз.");
  }

  revalidatePath("/pair");
  revalidatePath("/dashboard");
  revalidatePath("/profile");

  return { ok: true };
}

export async function createInvitation(): Promise<
  { ok: true; inviteUrl: string } | { ok: false; error: string }
> {
  const { supabase, context } = await getAuthContext();

  if (!context) {
    return actionError("Сначала создайте пару.");
  }

  if (context.isComplete) {
    return actionError("Партнёр уже подключён.");
  }

  const { data, error } = await supabase.rpc("create_invitation");

  if (error) {
    return actionError(mapCoupleError(error.message, error.details));
  }

  const payload = data as { invitation_token?: string } | null;
  const token = payload?.invitation_token;

  if (!token) {
    return actionError("Не удалось создать приглашение.");
  }

  revalidatePath("/pair");
  revalidatePath("/dashboard");

  return { ok: true, inviteUrl: `${getAppUrl()}/invite/${token}` };
}

export async function acceptInvitation(
  token: string,
): Promise<ActionResult | void> {
  const { supabase } = await requireUser();

  const { data, error } = await supabase.rpc("accept_invitation", {
    invitation_token: token,
  });

  if (error) {
    return actionError(mapCoupleError(error.message));
  }

  if (!data) {
    return actionError("Ссылка недействительна или истекла.");
  }

  revalidatePath("/dashboard");
  revalidatePath("/pair");
  revalidatePath("/profile");
  redirect("/dashboard");
}

export async function leaveAndAcceptInvitation(
  token: string,
): Promise<ActionResult | void> {
  const { supabase } = await requireUser();

  const { data, error } = await supabase.rpc("leave_and_accept_invitation", {
    invitation_token: token,
  });

  if (error) {
    return actionError(mapCoupleError(error.message));
  }

  if (!data) {
    return actionError("Ссылка недействительна или истекла.");
  }

  revalidatePath("/dashboard");
  revalidatePath("/pair");
  revalidatePath("/profile");
  redirect("/dashboard");
}

export async function leaveCouple(): Promise<ActionResult | void> {
  const { supabase } = await requireUser();
  const { error } = await supabase.rpc("leave_couple");

  if (error) {
    return actionError(mapCoupleError(error.message));
  }

  revalidatePath("/profile");
  revalidatePath("/pair");
  revalidatePath("/dashboard");
  redirect("/pair");
}

export async function updateRelationshipDate(formData: FormData): Promise<void> {
  const { supabase, context } = await getAuthContext();

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
  revalidatePath("/pair");
}
