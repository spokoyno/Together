import { HubPanelHeader } from "@/components/features/hub/hub-panel-header";
import { CatalogPanel } from "@/components/features/hub/catalog-panel";
import { CATALOG_CONFIGS, toCatalogPanelConfig, type CatalogKind } from "@/lib/hub/catalog";
import { PANEL_DESC_KEYS, PANEL_LABEL_KEYS } from "@/lib/i18n/panel-keys";
import { loadHubCatalog, requireHubContext } from "@/lib/hub/load-data.server";

const CATALOG_PANEL_ID: Record<CatalogKind, keyof typeof PANEL_LABEL_KEYS> = {
  game: "games",
  tv_series: "series",
  cartoon_series: "cartoons",
  anime: "anime",
};

type CatalogPageProps = {
  kind: CatalogKind;
};

export async function CatalogHubPage({ kind }: CatalogPageProps) {
  const ctx = await requireHubContext();
  const config = CATALOG_CONFIGS[kind];
  const entries = await loadHubCatalog(ctx, kind);
  const panelId = CATALOG_PANEL_ID[kind];

  return (
    <main className="mx-auto min-h-screen max-w-md px-5 pb-32 pt-8">
      <HubPanelHeader
        subtitleKey={PANEL_DESC_KEYS[panelId]}
        titleKey={PANEL_LABEL_KEYS[panelId]}
      />
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
