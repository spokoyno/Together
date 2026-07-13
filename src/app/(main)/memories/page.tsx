import { HubMenu } from "@/components/features/hub/hub-menu";
import { loadHubMenuCounts, requireHubContext } from "@/lib/hub/load-data.server";

export default async function MemoriesPage() {
  const ctx = await requireHubContext();
  const counts = await loadHubMenuCounts(ctx);

  return (
    <main className="mx-auto min-h-screen max-w-md px-5 pb-32 pt-8">
      <HubMenu counts={counts} />
    </main>
  );
}
