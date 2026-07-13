import { redirect } from "next/navigation";
import { InvitePageView } from "@/components/features/pair/invite-page-view";
import { requireUser } from "@/lib/auth/session";
import { getCoupleContextForUser } from "@/lib/couple/context.server";
import { validateInvitationToken } from "@/lib/couple/invitation";

type InvitePageProps = {
  params: Promise<{ token: string }>;
};

export default async function InvitePage({ params }: InvitePageProps) {
  const { token } = await params;
  const { supabase, user } = await requireUser();
  const context = await getCoupleContextForUser(user.id);
  const validation = await validateInvitationToken(supabase, token);

  if (context?.isComplete) {
    redirect("/dashboard");
  }

  if (!validation.valid) {
    return (
      <main className="mx-auto min-h-screen max-w-md px-5 py-8">
        <InvitePageView reason={validation.reason} state="invalid" token={token} />
      </main>
    );
  }

  if (context) {
    return (
      <main className="mx-auto min-h-screen max-w-md px-5 py-8">
        <InvitePageView state="conflict" token={token} />
      </main>
    );
  }

  return (
    <main className="mx-auto min-h-screen max-w-md px-5 py-8">
      <InvitePageView state="accept" token={token} />
    </main>
  );
}
