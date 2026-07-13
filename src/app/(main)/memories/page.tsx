import { ActivityFeed } from "@/components/features/hub/activity-feed";
import { loadActivityFeed } from "@/lib/hub/activity-feed.server";
import { requireHubContext } from "@/lib/hub/load-data.server";

export default async function MemoriesPage() {
  const ctx = await requireHubContext();
  const items = await loadActivityFeed(ctx);

  return (
    <main className="mx-auto min-h-screen max-w-md px-5 pb-32 pt-8">
      <ActivityFeed items={items} />
    </main>
  );
}
