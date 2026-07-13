import type { DashboardPanelId } from "@/lib/hub/panels-preferences";
import type { enCatalog } from "@/lib/i18n/en-catalog";

type CatalogKey = keyof typeof enCatalog;

export const PANEL_LABEL_KEYS: Record<DashboardPanelId, CatalogKey> = {
  movies: "panelMovies",
  games: "panelGames",
  series: "panelSeries",
  cartoons: "panelCartoons",
  anime: "panelAnime",
  books: "panelBooks",
  cooking: "panelCooking",
  compliments: "panelCompliments",
  shopping: "panelShopping",
  wishlist: "panelWishlist",
  tiers: "panelTiers",
  polls: "panelPolls",
  moments: "panelMoments",
  gallery: "panelGallery",
  cycle: "panelCycle",
  travel: "panelTravel",
  chores: "panelChores",
  countdown: "panelCountdown",
  habits: "panelHabits",
};

export const PANEL_DESC_KEYS: Record<DashboardPanelId, CatalogKey> = {
  movies: "panelMoviesDesc",
  games: "panelGamesDesc",
  series: "panelSeriesDesc",
  cartoons: "panelCartoonsDesc",
  anime: "panelAnimeDesc",
  books: "panelBooksDesc",
  cooking: "panelCookingDesc",
  compliments: "panelComplimentsDesc",
  shopping: "panelShoppingDesc",
  wishlist: "panelWishlistDesc",
  tiers: "panelTiersDesc",
  polls: "panelPollsDesc",
  moments: "panelMomentsDesc",
  gallery: "panelGalleryDesc",
  cycle: "panelCycleDesc",
  travel: "panelTravelDesc",
  chores: "panelChoresDesc",
  countdown: "panelCountdownDesc",
  habits: "panelHabitsDesc",
};

export const MOOD_LABEL_KEYS = {
  great: "moodGreat",
  good: "moodGood",
  neutral: "moodNeutral",
  irritated: "moodIrritated",
  low: "moodLow",
  hard: "moodHard",
} as const satisfies Record<string, CatalogKey>;
