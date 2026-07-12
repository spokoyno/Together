import type { SupabaseClient } from "@supabase/supabase-js";
import { getCoupleContext } from "@/lib/couple/context";

export { getAppUrl } from "@/lib/config/app-url";
export { isAuthPublicPath, isProtectedPath } from "@/lib/auth/paths";

export async function getPostAuthPath(
  supabase: SupabaseClient,
  userId: string,
): Promise<string> {
  const context = await getCoupleContext(supabase, userId);

  if (!context) {
    return "/pair";
  }

  return "/dashboard";
}
