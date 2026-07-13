import { HubPanelHeader } from "@/components/features/hub/hub-panel-header";
import { CountdownPanel } from "@/components/features/hub/countdown-panel";
import { loadHubCountdowns, requireHubContext } from "@/lib/hub/load-data.server";

export default async function HubCountdownPage() {
  const ctx = await requireHubContext();
  const events = await loadHubCountdowns(ctx);

  return (
    <main className="mx-auto min-h-screen max-w-md px-5 pb-32 pt-8">
      <HubPanelHeader subtitle="До важного момента" title="Отсчёт" />
      <CountdownPanel events={events} />
    </main>
  );
}
