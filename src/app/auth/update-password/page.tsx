import { redirect } from "next/navigation";
import { UpdatePasswordIntro } from "@/components/features/auth/update-password-intro";
import { getSessionUser } from "@/lib/auth/session";

export default async function UpdatePasswordPage() {
  const { user } = await getSessionUser();

  if (!user) {
    redirect("/auth?error=callback");
  }

  return (
    <main className="mx-auto min-h-screen max-w-md px-5 py-8">
      <UpdatePasswordIntro />
    </main>
  );
}
