import "server-only";

import { cache } from "react";
import { requireUser } from "@/lib/auth/session";
import { loadCoupleContext } from "@/lib/couple/context";
import { createClient } from "@/lib/supabase/server";
import type { CoupleContext } from "@/types/domain";

export const getCoupleContextForUser = cache(async (userId: string) => {
  const supabase = await createClient();
  return loadCoupleContext(supabase, userId);
});

export const getAuthContext = cache(async () => {
  const { supabase, user } = await requireUser();
  const context = await getCoupleContextForUser(user.id);
  return { supabase, user, context };
});

export async function requireCompleteCoupleContext(): Promise<{
  supabase: Awaited<ReturnType<typeof createClient>>;
  user: { id: string; email?: string };
  context: CoupleContext;
} | null> {
  const { supabase, user, context } = await getAuthContext();

  if (!context?.isComplete) {
    return null;
  }

  return { supabase, user, context };
}
