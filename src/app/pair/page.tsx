import { redirect } from "next/navigation";
import { PairPageShell } from "@/components/features/pair/pair-page-shell";
import { requireUser } from "@/lib/auth/session";
import { getCoupleContextForUser } from "@/lib/couple/context.server";
import { createInvitationUrl } from "@/lib/couple/invitation";

export default async function PairPage() {
  const { supabase, user } = await requireUser();
  const context = await getCoupleContextForUser(user.id);

  if (context?.isComplete) {
    redirect("/dashboard");
  }

  const inviteUrl =
    context && !context.isComplete ? await createInvitationUrl(supabase) : null;

  return (
    <main className="mx-auto min-h-screen max-w-md px-5 py-8">
      <PairPageShell
        hasContext={Boolean(context)}
        inviteUrl={inviteUrl}
        relationshipStartedOn={context?.relationshipStartedOn ?? null}
      />
    </main>
  );
}
