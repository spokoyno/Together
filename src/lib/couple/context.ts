import type { SupabaseClient } from "@supabase/supabase-js";
import type { CoupleContext } from "@/types/domain";

export async function getCoupleContext(
  supabase: SupabaseClient,
  userId: string,
): Promise<CoupleContext | null> {
  const { data: membership } = await supabase
    .from("couple_members")
    .select("couple_id")
    .eq("user_id", userId)
    .maybeSingle();

  if (!membership) {
    return null;
  }

  const { data: couple } = await supabase
    .from("couples")
    .select("id, relationship_started_on")
    .eq("id", membership.couple_id)
    .single();

  if (!couple) {
    return null;
  }

  const { data: memberRows } = await supabase
    .from("couple_members")
    .select("user_id, profiles(id, display_name)")
    .eq("couple_id", couple.id);

  const members =
    memberRows?.map((row) => {
      const rawProfile = row.profiles as
        | { id: string; display_name: string }
        | { id: string; display_name: string }[]
        | null;
      const profile = Array.isArray(rawProfile) ? rawProfile[0] : rawProfile;
      return {
        id: profile?.id ?? row.user_id,
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

export async function requireCompleteCouple(
  supabase: SupabaseClient,
  userId: string,
) {
  const context = await getCoupleContext(supabase, userId);

  if (!context) {
    return null;
  }

  if (!context.isComplete) {
    return null;
  }

  return context;
}
