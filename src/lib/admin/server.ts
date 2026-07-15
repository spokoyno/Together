import "server-only";

import { cache } from "react";
import { createClient } from "@/lib/supabase/server";

export const isAppAdmin = cache(async (userId: string): Promise<boolean> => {
  const supabase = await createClient();
  const { data } = await supabase
    .from("app_admins")
    .select("user_id")
    .eq("user_id", userId)
    .maybeSingle();

  return Boolean(data);
});
