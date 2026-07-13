export type DashboardPanelId =
  | "moments"
  | "movies"
  | "games"
  | "series"
  | "cartoons"
  | "anime"
  | "books"
  | "cooking"
  | "compliments"
  | "shopping"
  | "wishlist"
  | "tiers"
  | "polls"
  | "gallery"
  | "cycle"
  | "travel"
  | "chores"
  | "countdown"
  | "habits";

export type DashboardPanelPreference = {
  id: DashboardPanelId;
  visible: boolean;
};

export const DASHBOARD_PANEL_IDS: DashboardPanelId[] = [
  "movies",
  "games",
  "series",
  "cartoons",
  "anime",
  "books",
  "cooking",
  "compliments",
  "shopping",
  "wishlist",
  "tiers",
  "polls",
  "moments",
  "gallery",
  "cycle",
  "travel",
  "chores",
  "countdown",
  "habits",
];

export function defaultDashboardPreferences(): DashboardPanelPreference[] {
  return DASHBOARD_PANEL_IDS.map((id) => ({ id, visible: true }));
}

export function normalizeDashboardPreferences(
  stored: DashboardPanelPreference[] | null | undefined,
): DashboardPanelPreference[] {
  if (!stored?.length) {
    return defaultDashboardPreferences();
  }

  const known = new Set(DASHBOARD_PANEL_IDS);
  const cleaned = stored.filter((item) => known.has(item.id));
  for (const id of DASHBOARD_PANEL_IDS) {
    if (!cleaned.some((item) => item.id === id)) {
      cleaned.push({ id, visible: true });
    }
  }
  return cleaned;
}
