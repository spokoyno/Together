import { BottomNav } from "@/components/layout/bottom-nav";
import { requireUser } from "@/lib/auth/session";

export default async function MainLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  await requireUser();

  return (
    <>
      {children}
      <BottomNav />
    </>
  );
}
