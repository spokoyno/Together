import "server-only";

import { cache } from "react";
import { loadCoupleContext } from "@/lib/couple/context";
import { createClient } from "@/lib/supabase/server";

export const getCoupleContextForUser = cache(async (userId: string) => {
  const supabase = await createClient();
  return loadCoupleContext(supabase, userId);
});
