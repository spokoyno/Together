import "server-only";

import type { HubComplimentState } from "@/components/features/hub/types";

const HOUR_MS = 60 * 60 * 1000;

export function buildComplimentState(input: {
  partnerJarCount: number;
  myJarCount: number;
  lastDrawAt: string | null;
}): HubComplimentState {
  const now = Date.now();
  let waitMinutes = 0;

  if (input.lastDrawAt) {
    const elapsed = now - new Date(input.lastDrawAt).getTime();
    const remaining = HOUR_MS - elapsed;
    if (remaining > 0) {
      waitMinutes = Math.ceil(remaining / 60000);
    }
  }

  return {
    partnerJarCount: input.partnerJarCount,
    myJarCount: input.myJarCount,
    canDraw: input.myJarCount > 0 && waitMinutes === 0,
    waitMinutes,
  };
}
