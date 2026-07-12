import type { SupabaseClient } from "@supabase/supabase-js";
import type { CoupleContext } from "@/types/domain";

type MembershipRow = {
  couple_id: string;
  couples: {
    id: string;
    relationship_started_on: string | null;
    couple_members: Array<{
      user_id: string;
      profiles:
        | { id: string; display_name: string }
        | { id: string; display_name: string }[]
        | null;
    }>;
  } | null;
};

export async function loadCoupleContext(
  supabase: SupabaseClient,
  userId: string,
): Promise<CoupleContext | null> {
  const { data: membership } = await supabase
    .from("couple_members")
    .select(
      "couple_id, couples(id, relationship_started_on, couple_members(user_id, profiles(id, display_name)))",
    )
    .eq("user_id", userId)
    .maybeSingle();

  const row = membership as MembershipRow | null;
  const couple = row?.couples;

  if (!couple) {
    return null;
  }

  const members =
    couple.couple_members?.map((member) => {
      const rawProfile = member.profiles;
      const profile = Array.isArray(rawProfile) ? rawProfile[0] : rawProfile;
      return {
        id: profile?.id ?? member.user_id,
        display_name: profile?.display_name ?? "Пользователь",
      };
    }) ?? [];

  const partner = members.find((member) => member.id !== userId) ?? null;

  return {
    coupleId: couple.id,
    relationshipStartedOn: couple.relationship_started_on,
    members,
    partner,
    isComplete: members.length >= 2,
  };
}

export async function getCoupleContext(
  supabase: SupabaseClient,
  userId: string,
): Promise<CoupleContext | null> {
  return loadCoupleContext(supabase, userId);
}

export async function requireCompleteCouple(
  supabase: SupabaseClient,
  userId: string,
) {
  const context = await getCoupleContext(supabase, userId);

  if (!context?.isComplete) {
    return null;
  }

  return context;
}
