import { redirect } from "next/navigation";
import { getPostAuthPath } from "@/lib/auth/routes";
import { getSessionUser } from "@/lib/auth/session";

export default async function LandingPage() {
  const { supabase, user } = await getSessionUser();

  if (!user) {
    redirect("/auth");
  }

  const destination = await getPostAuthPath(supabase, user.id);
  redirect(destination);
}
