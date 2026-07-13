import { HubPanelHeader } from "@/components/features/hub/hub-panel-header";
import { CookingPanel } from "@/components/features/hub/cooking-panel";
import { loadHubCooking, requireHubContext } from "@/lib/hub/load-data.server";

export default async function HubCookingPage() {
  const ctx = await requireHubContext();
  const dishes = await loadHubCooking(ctx);

  return (
    <main className="mx-auto min-h-screen max-w-md px-5 pb-32 pt-8">
      <HubPanelHeader subtitle="Хотим приготовить и уже готовили" title="Готовка" />
      <CookingPanel coupleId={ctx.coupleId} dishes={dishes} userId={ctx.userId} />
    </main>
  );
}
