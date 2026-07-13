import { HubPanelHeader } from "@/components/features/hub/hub-panel-header";
import { ComplimentsPanel } from "@/components/features/hub/compliments-panel";
import { loadHubComplimentState, requireHubContext } from "@/lib/hub/load-data.server";

export default async function HubComplimentsPage() {
  const ctx = await requireHubContext();
  const complimentState = await loadHubComplimentState(ctx);

  return (
    <main className="mx-auto min-h-screen max-w-md px-5 pb-32 pt-8">
      <HubPanelHeader title="Комплименты" />
      <ComplimentsPanel partnerName={ctx.partnerName} state={complimentState} />
    </main>
  );
}
