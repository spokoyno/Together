import { HubPanelHeader } from "@/components/features/hub/hub-panel-header";
import { BooksPanel } from "@/components/features/hub/books-panel";
import { isAppAdmin } from "@/lib/admin/server";
import { loadHubBooks, requireHubContext } from "@/lib/hub/load-data.server";

export default async function HubBooksPage() {
  const ctx = await requireHubContext();
  const [books, admin] = await Promise.all([loadHubBooks(ctx), isAppAdmin(ctx.userId)]);

  return (
    <main className="mx-auto min-h-screen max-w-md px-5 pb-32 pt-8">
      <HubPanelHeader subtitleKey="panelBooksDesc" titleKey="panelBooks" />
      <BooksPanel
        books={books}
        isAdmin={admin}
        partnerId={ctx.partnerId}
        partnerName={ctx.partnerName}
        userId={ctx.userId}
      />
    </main>
  );
}
