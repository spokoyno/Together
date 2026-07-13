import { HubPanelHeader } from "@/components/features/hub/hub-panel-header";
import { WishlistPanel } from "@/components/features/hub/wishlist-panel";
import { loadHubWishlist, requireHubContext } from "@/lib/hub/load-data.server";

export default async function HubWishlistPage() {
  const ctx = await requireHubContext();
  const items = await loadHubWishlist(ctx);

  return (
    <main className="mx-auto min-h-screen max-w-md px-5 pb-32 pt-8">
      <HubPanelHeader subtitle="Желания, которые можно исполнить" title="Wishlist" />
      <WishlistPanel
        coupleId={ctx.coupleId}
        items={items}
        partnerName={ctx.partnerName}
        userId={ctx.userId}
      />
    </main>
  );
}
