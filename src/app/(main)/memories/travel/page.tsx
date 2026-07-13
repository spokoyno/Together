import { HubPanelHeader } from "@/components/features/hub/hub-panel-header";
import { TravelPanel } from "@/components/features/hub/travel-panel";
import { loadHubTravel, requireHubContext } from "@/lib/hub/load-data.server";

export default async function HubTravelPage() {
  const ctx = await requireHubContext();
  const destinations = await loadHubTravel(ctx);

  return (
    <main className="mx-auto min-h-screen max-w-md px-5 pb-32 pt-8">
      <HubPanelHeader subtitleKey="panelTravelDesc" titleKey="panelTravel" />
      <TravelPanel destinations={destinations} />
    </main>
  );
}
