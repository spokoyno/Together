import type { SupabaseClient } from "@supabase/supabase-js";
import { getAppUrl } from "@/lib/config/app-url";

export type InvitationValidation =
  | { valid: true; coupleId: string }
  | { valid: false; reason: "invalid" | "expired" | "accepted" | "couple_full" };

type RpcValidation = {
  valid?: boolean;
  reason?: string;
  couple_id?: string;
};

export async function validateInvitationToken(
  supabase: SupabaseClient,
  token: string,
): Promise<InvitationValidation> {
  const { data, error } = await supabase.rpc("validate_invitation", {
    invitation_token: token,
  });

  if (error || !data) {
    return { valid: false, reason: "invalid" };
  }

  const payload = data as RpcValidation;

  if (payload.valid && payload.couple_id) {
    return { valid: true, coupleId: payload.couple_id };
  }

  const reason = payload.reason;
  if (
    reason === "expired" ||
    reason === "accepted" ||
    reason === "couple_full" ||
    reason === "invalid"
  ) {
    return { valid: false, reason };
  }

  return { valid: false, reason: "invalid" };
}

export async function createInvitationUrl(
  supabase: SupabaseClient,
): Promise<string | null> {
  const { data, error } = await supabase.rpc("create_invitation");

  if (error || !data) {
    return null;
  }

  const token = (data as { invitation_token?: string }).invitation_token;
  if (!token) {
    return null;
  }

  return `${getAppUrl()}/invite/${token}`;
}
