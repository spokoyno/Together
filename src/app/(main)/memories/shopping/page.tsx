import { HubPanelHeader } from "@/components/features/hub/hub-panel-header";
import { ShoppingPanel } from "@/components/features/hub/shopping-panel";
import { loadHubShopping, requireHubContext } from "@/lib/hub/load-data.server";

export default async function HubShoppingPage() {
  const ctx = await requireHubContext();
  const notes = await loadHubShopping(ctx);

  return (
    <main className="mx-auto min-h-screen max-w-md px-5 pb-32 pt-8">
      <HubPanelHeader subtitle="Записки на стену" title="Список покупок" />
      <ShoppingPanel notes={notes} />
    </main>
  );
}
