import { redirect } from "next/navigation";
import { ChatShell } from "@/components/features/chat/chat-shell";
import { UserAvatar } from "@/components/ui/user-avatar";
import { requireUser } from "@/lib/auth/session";
import { getRecentCoupleMessages } from "@/lib/chat/messages";
import { getChatNotes, getSavedMessages } from "@/lib/chat/private";
import { markChatAsRead } from "@/lib/chat/unread";
import { getCoupleContextForUser } from "@/lib/couple/context.server";
import { signMediaPaths } from "@/lib/media/actions";

export const dynamic = "force-dynamic";

export default async function ChatPage() {
  const { supabase, user } = await requireUser();
  const context = await getCoupleContextForUser(user.id);

  if (!context?.isComplete) {
    redirect("/dashboard");
  }

  const partner = context.partner;
  const memberNames = Object.fromEntries(
    context.members.map((member) => [member.id, member.display_name]),
  );

  await markChatAsRead(supabase, user.id, context.coupleId);

  const { data: partnerProfile } = await supabase
    .from("profiles")
    .select("avatar_path")
    .eq("id", partner!.id)
    .single();

  const signed = await signMediaPaths(
    supabase,
    partnerProfile?.avatar_path ? [partnerProfile.avatar_path] : [],
  );
  const partnerAvatarUrl = partnerProfile?.avatar_path
    ? signed[partnerProfile.avatar_path] ?? null
    : null;

  const [messagesPage, savedMessages, notes] = await Promise.all([
    getRecentCoupleMessages(supabase, context.coupleId, memberNames),
    getSavedMessages(supabase, user.id, context.coupleId, memberNames),
    getChatNotes(supabase, user.id, context.coupleId, memberNames),
  ]);

  const savedIds = savedMessages.map((message) => message.id);

  return (
    <main className="mx-auto flex h-[100dvh] max-w-md flex-col bg-[var(--chat-bg)]">
      <header className="fade-up sticky top-0 z-10 border-b border-[var(--border)] bg-[var(--surface-elevated)] px-4 py-3 pt-[max(0.75rem,env(safe-area-inset-top))]">
        <div className="flex items-center gap-3">
          <UserAvatar
            imageUrl={partnerAvatarUrl}
            name={partner?.display_name ?? "Партнёр"}
            size="sm"
          />
          <div>
            <h1 className="text-lg font-semibold">{partner?.display_name ?? "Партнёр"}</h1>
            <p className="text-xs text-[var(--muted)]">личный чат</p>
          </div>
        </div>
      </header>

      <ChatShell
        coupleId={context.coupleId}
        initialHasMore={messagesPage.hasMore}
        initialMessages={messagesPage.messages}
        initialNotes={notes}
        initialSavedIds={savedIds}
        initialSavedMessages={savedMessages}
        partnerName={partner?.display_name ?? "Партнёр"}
        userId={user.id}
      />
    </main>
  );
}
