import { HubPanelHeader } from "@/components/features/hub/hub-panel-header";
import { CatalogPanel } from "@/components/features/hub/catalog-panel";
import { CATALOG_CONFIGS, toCatalogPanelConfig, type CatalogKind } from "@/lib/hub/catalog";
import { loadHubCatalog, requireHubContext } from "@/lib/hub/load-data.server";

type CatalogPageProps = {
  kind: CatalogKind;
};

export async function CatalogHubPage({ kind }: CatalogPageProps) {
  const ctx = await requireHubContext();
  const config = CATALOG_CONFIGS[kind];
  const entries = await loadHubCatalog(ctx, kind);

  return (
    <main className="mx-auto min-h-screen max-w-md px-5 pb-32 pt-8">
      <HubPanelHeader subtitle={config.subtitle} title={config.label} />
      <CatalogPanel
        config={toCatalogPanelConfig(config)}
        entries={entries}
        partnerId={ctx.partnerId}
        partnerName={ctx.partnerName}
        userId={ctx.userId}
      />
    </main>
  );
}
