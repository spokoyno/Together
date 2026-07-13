import { HubPanelHeader } from "@/components/features/hub/hub-panel-header";
import { MomentsPanel } from "@/components/features/hub/moments-panel";
import { loadHubMemories, requireHubContext } from "@/lib/hub/load-data.server";

export default async function HubMomentsPage() {
  const ctx = await requireHubContext();
  const memories = await loadHubMemories(ctx);

  return (
    <main className="mx-auto min-h-screen max-w-md px-5 pb-32 pt-8">
      <HubPanelHeader subtitle="Фото, описания и комментарии" title="Наши моменты" />
      <MomentsPanel coupleId={ctx.coupleId} memories={memories} userId={ctx.userId} />
    </main>
  );
}
