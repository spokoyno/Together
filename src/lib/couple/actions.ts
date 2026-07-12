"use server";

import { createHash, randomBytes } from "crypto";
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

function mapCoupleError(code: string): string {
  switch (code) {
    case "already_in_couple":
      return "Вы уже состоите в паре.";
    case "invalid_or_expired_invitation":
      return "Ссылка недействительна или истекла.";
    case "not_authenticated":
      return "Сначала войдите в аккаунт.";
    case "not_in_couple":
      return "Вы не состоите в паре.";
    default:
      return "Не удалось выполнить действие.";
  }
}

export async function createCouple(formData: FormData): Promise<void> {
  const { supabase, user } = await requireUser();
  const existing = await getCoupleContext(supabase, user.id);

  if (existing) {
    redirect("/pair");
  }

  const parsed = createCoupleSchema.safeParse(parseFormData(formData));
  if (!parsed.success) {
    return;
  }

  const { data: couple, error: coupleError } = await supabase
    .from("couples")
    .insert({
      created_by: user.id,
      relationship_started_on: parsed.data.relationshipStartedOn,
    })
    .select("id")
    .single();

  if (coupleError || !couple) {
    return;
  }

  const { error: memberError } = await supabase.from("couple_members").insert({
    couple_id: couple.id,
    user_id: user.id,
  });

  if (memberError) {
    return;
  }

  revalidatePath("/pair");
  revalidatePath("/dashboard");
  redirect("/pair");
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

  const token = randomBytes(32).toString("base64url");
  const tokenHash = createHash("sha256").update(token).digest("hex");
  const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString();

  const { error } = await supabase.from("invitations").insert({
    couple_id: context.coupleId,
    created_by: user.id,
    token_hash: tokenHash,
    expires_at: expiresAt,
  });

  if (error) {
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
    const code = error.message.includes("already_in_couple")
      ? "already_in_couple"
      : error.message.includes("invalid_or_expired")
        ? "invalid_or_expired_invitation"
        : "unknown";
    return actionError(mapCoupleError(code));
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
