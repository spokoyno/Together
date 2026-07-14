import type { LucideIcon } from "lucide-react";
import { Gamepad2, MonitorPlay, Sparkles, Tv } from "lucide-react";
import type { enCatalog } from "@/lib/i18n/en-catalog";
import type { SharedCollectionKind } from "@/lib/hub/shared-collections-actions";

export type CatalogKind = "game" | "tv_series" | "cartoon_series" | "anime";

type CatalogKey = keyof typeof enCatalog;

export type CatalogSearchResult = {
  id: number;
  title: string;
  posterUrl: string | null;
  year: string | null;
};

export type CatalogEntry = {
  id: string;
  external_id: number;
  title: string;
  poster_url: string | null;
  status: "want" | "completed";
  ratings: Record<string, number>;
  reviews: Record<string, string>;
  author_name: string;
  completed_at: string | null;
  created_at: string;
};

export type CatalogPanelConfig = {
  kind: CatalogKind;
  searchPath: string;
  sharedKind: SharedCollectionKind;
  i18n: {
    wantTab: CatalogKey;
    completedTab: CatalogKey;
    completedAction: CatalogKey;
    searchPlaceholder: CatalogKey;
    emptyWant: CatalogKey;
    emptyCompleted: CatalogKey;
  };
};

export type CatalogConfig = CatalogPanelConfig & {
  label: CatalogKey;
  subtitle: CatalogKey;
  href: string;
  icon: LucideIcon;
  tone: string;
  completedSubtitle: CatalogKey;
};

export function toCatalogPanelConfig(config: CatalogConfig): CatalogPanelConfig {
  return {
    kind: config.kind,
    searchPath: config.searchPath,
    sharedKind: config.sharedKind,
    i18n: config.i18n,
  };
}

export const CATALOG_HREFS: Record<CatalogKind, string> = {
  game: "/memories/games",
  tv_series: "/memories/series",
  cartoon_series: "/memories/cartoons",
  anime: "/memories/anime",
};

export const CATALOG_CONFIGS: Record<CatalogKind, CatalogConfig> = {
  game: {
    kind: "game",
    label: "panelGames",
    subtitle: "panelGamesDesc",
    href: "/memories/games",
    icon: Gamepad2,
    tone: "from-purple-500/20 to-purple-500/5",
    searchPath: "/api/games/search",
    sharedKind: "game",
    i18n: {
      wantTab: "catalogGameWantTab",
      completedTab: "catalogGameCompletedTab",
      completedAction: "catalogGameCompletedAction",
      searchPlaceholder: "catalogGameSearchPlaceholder",
      emptyWant: "catalogGameEmptyWant",
      emptyCompleted: "catalogGameEmptyCompleted",
    },
    completedSubtitle: "catalogGameCompletedSubtitle",
  },
  tv_series: {
    kind: "tv_series",
    label: "panelSeries",
    subtitle: "panelSeriesDesc",
    href: "/memories/series",
    icon: Tv,
    tone: "from-slate-500/20 to-slate-500/5",
    searchPath: "/api/tv/search",
    sharedKind: "tv_series",
    i18n: {
      wantTab: "catalogTvWantTab",
      completedTab: "catalogTvCompletedTab",
      completedAction: "catalogTvCompletedAction",
      searchPlaceholder: "catalogTvSearchPlaceholder",
      emptyWant: "catalogTvEmptyWant",
      emptyCompleted: "catalogTvEmptyCompleted",
    },
    completedSubtitle: "catalogTvCompletedSubtitle",
  },
  cartoon_series: {
    kind: "cartoon_series",
    label: "panelCartoons",
    subtitle: "panelCartoonsDesc",
    href: "/memories/cartoons",
    icon: MonitorPlay,
    tone: "from-yellow-500/20 to-yellow-500/5",
    searchPath: "/api/cartoons/search",
    sharedKind: "cartoon_series",
    i18n: {
      wantTab: "catalogCartoonWantTab",
      completedTab: "catalogCartoonCompletedTab",
      completedAction: "catalogCartoonCompletedAction",
      searchPlaceholder: "catalogCartoonSearchPlaceholder",
      emptyWant: "catalogCartoonEmptyWant",
      emptyCompleted: "catalogCartoonEmptyCompleted",
    },
    completedSubtitle: "catalogCartoonCompletedSubtitle",
  },
  anime: {
    kind: "anime",
    label: "panelAnime",
    subtitle: "panelAnimeDesc",
    href: "/memories/anime",
    icon: Sparkles,
    tone: "from-red-500/20 to-red-500/5",
    searchPath: "/api/anime/search",
    sharedKind: "anime",
    i18n: {
      wantTab: "catalogAnimeWantTab",
      completedTab: "catalogAnimeCompletedTab",
      completedAction: "catalogAnimeCompletedAction",
      searchPlaceholder: "catalogAnimeSearchPlaceholder",
      emptyWant: "catalogAnimeEmptyWant",
      emptyCompleted: "catalogAnimeEmptyCompleted",
    },
    completedSubtitle: "catalogAnimeCompletedSubtitle",
  },
};
