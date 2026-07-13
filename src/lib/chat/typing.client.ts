"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { createClient } from "@/lib/supabase/client";

const TYPING_TTL_MS = 3000;

export function useChatTyping(coupleId: string, userId: string) {
  const [partnerTyping, setPartnerTyping] = useState(false);
  const hideTimerRef = useRef<number | null>(null);
  const lastSentRef = useRef(0);

  useEffect(() => {
    const supabase = createClient();
    const channel = supabase.channel(`typing:${coupleId}`, {
      config: { broadcast: { self: false } },
    });

    channel.on("broadcast", { event: "typing" }, (payload) => {
      const data = payload.payload as { userId?: string } | undefined;
      if (!data?.userId || data.userId === userId) {
        return;
      }

      setPartnerTyping(true);
      if (hideTimerRef.current) {
        window.clearTimeout(hideTimerRef.current);
      }
      hideTimerRef.current = window.setTimeout(() => {
        setPartnerTyping(false);
      }, TYPING_TTL_MS);
    });

    void channel.subscribe();

    return () => {
      if (hideTimerRef.current) {
        window.clearTimeout(hideTimerRef.current);
      }
      void supabase.removeChannel(channel);
    };
  }, [coupleId, userId]);

  const broadcastTyping = useCallback(() => {
    const now = Date.now();
    if (now - lastSentRef.current < 1200) {
      return;
    }
    lastSentRef.current = now;

    const supabase = createClient();
    const channel = supabase.channel(`typing:${coupleId}`, {
      config: { broadcast: { self: false } },
    });
    void channel.subscribe((status) => {
      if (status === "SUBSCRIBED") {
        void channel.send({
          type: "broadcast",
          event: "typing",
          payload: { userId },
        });
        window.setTimeout(() => {
          void supabase.removeChannel(channel);
        }, 100);
      }
    });
  }, [coupleId, userId]);

  return { partnerTyping, broadcastTyping };
}
