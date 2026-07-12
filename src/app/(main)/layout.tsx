import { BottomNav } from "@/components/layout/bottom-nav";
import { requireUser } from "@/lib/auth/session";
import { getUnreadChatCount } from "@/lib/chat/unread";
import { getCoupleContextForUser } from "@/lib/couple/context.server";

export default async function MainLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  const { supabase, user } = await requireUser();
  const context = await getCoupleContextForUser(user.id);
  const unread =
    context?.isComplete
      ? await getUnreadChatCount(supabase, user.id, context.coupleId)
      : 0;

  return (
    <>
      {children}
      <BottomNav
        coupleId={context?.isComplete ? context.coupleId : null}
        initialUnread={unread}
        userId={user.id}
      />
    </>
  );
}
