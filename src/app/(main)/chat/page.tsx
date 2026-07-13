import { redirect } from "next/navigation";
import { ChatPageHeader } from "@/components/features/chat/chat-page-header";
import { ChatShell } from "@/components/features/chat/chat-shell";
import { requireUser } from "@/lib/auth/session";
import { getRecentCoupleMessages } from "@/lib/chat/messages";
import { getChatMediaMessages } from "@/lib/chat/media-gallery.server";
import { getChatNotes, getSavedMessages } from "@/lib/chat/private";
import { markChatAsRead } from "@/lib/chat/unread";
import { getCoupleContextForUser } from "@/lib/couple/context.server";
import { signMediaPaths } from "@/lib/media/actions";
import { resolvePartnerDisplayName } from "@/lib/partner/display-name";

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

  const [myProfile, partnerProfile] = await Promise.all([
    supabase.from("profiles").select("partner_nickname").eq("id", user.id).single(),
    supabase.from("profiles").select("avatar_path").eq("id", partner!.id).single(),
  ]);

  const partnerDisplayName = resolvePartnerDisplayName(
    partner!.display_name,
    myProfile.data?.partner_nickname,
  );

  memberNames[partner!.id] = partnerDisplayName;

  const signed = await signMediaPaths(
    supabase,
    partnerProfile.data?.avatar_path ? [partnerProfile.data.avatar_path] : [],
  );
  const partnerAvatarUrl = partnerProfile.data?.avatar_path
    ? (signed[partnerProfile.data.avatar_path] ?? null)
    : null;

  const [messagesPage, savedMessages, notes, mediaMessages] = await Promise.all([
    getRecentCoupleMessages(supabase, context.coupleId, memberNames, user.id),
    getSavedMessages(supabase, user.id, context.coupleId, memberNames),
    getChatNotes(supabase, user.id, context.coupleId, memberNames),
    getChatMediaMessages(supabase, context.coupleId, memberNames, user.id),
  ]);

  const savedIds = savedMessages.map((message) => message.id);

  return (
    <main className="mx-auto flex h-[100dvh] max-w-md flex-col bg-[var(--chat-bg)]">
      <ChatPageHeader partnerAvatarUrl={partnerAvatarUrl} partnerDisplayName={partnerDisplayName} />

      <ChatShell
        coupleId={context.coupleId}
        initialHasMore={messagesPage.hasMore}
        initialMediaMessages={mediaMessages}
        initialMessages={messagesPage.messages}
        initialNotes={notes}
        initialSavedIds={savedIds}
        initialSavedMessages={savedMessages}
        partnerName={partnerDisplayName}
        userId={user.id}
      />
    </main>
  );
}
