import type { SupabaseClient } from "@supabase/supabase-js";

export async function getPostAuthPath(
  supabase: SupabaseClient,
  userId: string,
): Promise<string> {
  const [{ data: profile }, { data: membership }] = await Promise.all([
    supabase.from("profiles").select("birthday").eq("id", userId).maybeSingle(),
    supabase.from("couple_members").select("couple_id").eq("user_id", userId).maybeSingle(),
  ]);

  if (!profile?.birthday) {
    return "/onboarding/birthday";
  }

  return membership ? "/dashboard" : "/pair";
}

export { getAppUrl } from "@/lib/config/app-url";
export { isAuthPublicPath, isProtectedPath } from "@/lib/auth/paths";
