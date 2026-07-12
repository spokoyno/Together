import { type NextRequest } from "next/server";
import { updateSession } from "@/lib/supabase/middleware";

export async function middleware(request: NextRequest) {
  return updateSession(request);
}

export const config = {
  matcher: [
    "/dashboard/:path*",
    "/chat/:path*",
    "/plans/:path*",
    "/memories/:path*",
    "/mood/:path*",
    "/events/:path*",
    "/profile/:path*",
    "/question/:path*",
    "/pair/:path*",
    "/invite/:path*",
    "/auth/:path*",
  ],
};
