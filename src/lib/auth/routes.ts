import type { SupabaseClient } from "@supabase/supabase-js";
import { getCoupleContext } from "@/lib/couple/context";

export function getAppUrl() {
  return process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";
}

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

export function isAuthPublicPath(pathname: string): boolean {
  return (
    pathname === "/auth" ||
    pathname.startsWith("/auth/callback") ||
    pathname === "/auth/update-password"
  );
}

export function isProtectedPath(pathname: string): boolean {
  if (pathname.startsWith("/_next")) return false;
  if (pathname.startsWith("/api")) return false;
  if (isAuthPublicPath(pathname)) return false;
  if (pathname === "/") return false;
  return true;
}
