import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export async function getSessionUser() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  return { supabase, user };
}

export async function requireUser(nextPath?: string) {
  const { supabase, user } = await getSessionUser();

  if (!user) {
    if (nextPath) {
      redirect(`/auth?next=${encodeURIComponent(nextPath)}`);
    }
    redirect("/auth");
  }

  return { supabase, user };
}
