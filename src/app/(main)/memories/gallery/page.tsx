import { HubPanelHeader } from "@/components/features/hub/hub-panel-header";
import { GalleryPanel } from "@/components/features/hub/gallery-panel";
import { loadHubGallery, requireHubContext } from "@/lib/hub/load-data.server";

export default async function HubGalleryPage() {
  const ctx = await requireHubContext();
  const items = await loadHubGallery(ctx);

  return (
    <main className="mx-auto min-h-screen max-w-md px-5 pb-32 pt-8">
      <HubPanelHeader subtitle="Общие фото пары" title="Галерея" />
      <GalleryPanel coupleId={ctx.coupleId} items={items} userId={ctx.userId} />
    </main>
  );
}
