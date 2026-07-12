import { redirect } from "next/navigation";
import { ChatPanel } from "@/components/features/chat/chat-panel";
import { requireUser } from "@/lib/auth/session";
import { getCoupleMessages } from "@/lib/chat/messages";
import { markChatAsRead } from "@/lib/chat/unread";
import { getCoupleContext } from "@/lib/couple/context";

export default async function ChatPage() {
  const { supabase, user } = await requireUser();
  const context = await getCoupleContext(supabase, user.id);

  if (!context?.isComplete) {
    redirect("/dashboard");
  }

  const partner = context.partner;
  await markChatAsRead(supabase, user.id, context.coupleId);
  const messages = await getCoupleMessages(supabase, context.coupleId);

  return (
    <main className="mx-auto flex h-[100dvh] max-w-md flex-col bg-[var(--chat-bg)]">
      <header className="fade-up sticky top-0 z-10 border-b border-[var(--border)] bg-[var(--surface-elevated)] px-4 py-3 pt-[max(0.75rem,env(safe-area-inset-top))]">
        <div className="flex items-center gap-3">
          <div className="grid size-10 place-items-center rounded-full bg-[var(--accent-soft)] text-sm font-bold text-[var(--accent)]">
            {partner?.display_name?.slice(0, 1).toUpperCase() ?? "?"}
          </div>
          <div>
            <h1 className="text-lg font-semibold">{partner?.display_name ?? "Партнёр"}</h1>
            <p className="text-xs text-[var(--muted)]">личный чат</p>
          </div>
        </div>
      </header>

      <ChatPanel
        coupleId={context.coupleId}
        initialMessages={messages}
        partnerName={partner?.display_name ?? "Партнёр"}
        userId={user.id}
      />
    </main>
  );
}
