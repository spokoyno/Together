import { redirect } from "next/navigation";
import { ChatPanel } from "@/components/features/chat/chat-panel";
import { requireUser } from "@/lib/auth/session";
import { getCoupleMessages } from "@/lib/chat/messages";
import { getCoupleContext } from "@/lib/couple/context";

export default async function ChatPage() {
  const { supabase, user } = await requireUser();
  const context = await getCoupleContext(supabase, user.id);

  if (!context?.isComplete) {
    redirect("/dashboard");
  }

  const partner = context.partner;
  const messages = await getCoupleMessages(supabase, context.coupleId);

  return (
    <main className="mx-auto min-h-screen max-w-md px-5 pb-28 pt-8">
      <h1 className="text-3xl font-bold">Чат</h1>
      <p className="mt-2 text-sm text-[var(--muted)]">
        Приватная переписка с {partner?.display_name ?? "партнёром"}
      </p>

      <div className="mt-6">
        <ChatPanel
          coupleId={context.coupleId}
          initialMessages={messages}
          partnerName={partner?.display_name ?? "Партнёр"}
          userId={user.id}
        />
      </div>
    </main>
  );
}
