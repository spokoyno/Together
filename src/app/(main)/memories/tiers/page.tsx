import { HubPanelHeader } from "@/components/features/hub/hub-panel-header";
import { TierListsPanel } from "@/components/features/hub/tier-lists-panel";
import { loadHubTierChallenges, requireHubContext } from "@/lib/hub/load-data.server";

export default async function HubTiersPage() {
  const ctx = await requireHubContext();
  const challenges = await loadHubTierChallenges(ctx);

  return (
    <main className="mx-auto min-h-screen max-w-md px-5 pb-32 pt-8">
      <HubPanelHeader subtitleKey="panelTiersDesc" titleKey="panelTiers" />
      <TierListsPanel
        challenges={challenges}
        coupleId={ctx.coupleId}
        partnerId={ctx.partnerId}
        partnerName={ctx.partnerName}
        userId={ctx.userId}
      />
    </main>
  );
}
