import type { SupabaseClient } from "@supabase/supabase-js";

export async function getPostAuthPath(
  supabase: SupabaseClient,
  userId: string,
): Promise<string> {
  const { data } = await supabase
    .from("couple_members")
    .select("couple_id")
    .eq("user_id", userId)
    .maybeSingle();

  return data ? "/dashboard" : "/pair";
}

export { getAppUrl } from "@/lib/config/app-url";
export { isAuthPublicPath, isProtectedPath } from "@/lib/auth/paths";
