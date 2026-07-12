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
