import { HubPanelHeader } from "@/components/features/hub/hub-panel-header";
import { PollsPanel } from "@/components/features/hub/polls-panel";
import { loadHubPolls, requireHubContext } from "@/lib/hub/load-data.server";

export default async function HubPollsPage() {
  const ctx = await requireHubContext();
  const polls = await loadHubPolls(ctx);

  return (
    <main className="mx-auto min-h-screen max-w-md px-5 pb-32 pt-8">
      <HubPanelHeader subtitleKey="panelPollsDesc" titleKey="panelPolls" />
      <PollsPanel
        partnerId={ctx.partnerId}
        partnerName={ctx.partnerName}
        polls={polls}
        userId={ctx.userId}
      />
    </main>
  );
}
