import type { LucideIcon } from "lucide-react";
import { Gamepad2, MonitorPlay, Sparkles, Tv } from "lucide-react";

export type CatalogKind = "game" | "tv_series" | "cartoon_series" | "anime";

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

export type CatalogConfig = {
  kind: CatalogKind;
  label: string;
  subtitle: string;
  href: string;
  icon: LucideIcon;
  tone: string;
  searchPath: string;
  wantTab: string;
  completedTab: string;
  completedAction: string;
  searchPlaceholder: string;
  emptyWant: string;
  emptyCompleted: string;
  completedSubtitle: string;
};

export const CATALOG_CONFIGS: Record<CatalogKind, CatalogConfig> = {
  game: {
    kind: "game",
    label: "Игры",
    subtitle: "Проходим вместе",
    href: "/memories/games",
    icon: Gamepad2,
    tone: "from-purple-500/20 to-purple-500/5",
    searchPath: "/api/games/search",
    wantTab: "Хочу сыграть",
    completedTab: "Пройдено",
    completedAction: "Пройдено",
    searchPlaceholder: "Название игры",
    emptyWant: "Добавьте игру, в которую хотите сыграть вместе.",
    emptyCompleted: "Пройденные игры появятся здесь.",
    completedSubtitle: "Прошли игру",
  },
  tv_series: {
    kind: "tv_series",
    label: "Сериалы",
    subtitle: "Смотрим вместе",
    href: "/memories/series",
    icon: Tv,
    tone: "from-slate-500/20 to-slate-500/5",
    searchPath: "/api/tv/search",
    wantTab: "Хочу посмотреть",
    completedTab: "Просмотрено",
    completedAction: "Просмотрено",
    searchPlaceholder: "Название сериала",
    emptyWant: "Добавьте сериал в список.",
    emptyCompleted: "Просмотренные сериалы появятся здесь.",
    completedSubtitle: "Посмотрели сериал",
  },
  cartoon_series: {
    kind: "cartoon_series",
    label: "Мультсериалы",
    subtitle: "Мультики для двоих",
    href: "/memories/cartoons",
    icon: MonitorPlay,
    tone: "from-yellow-500/20 to-yellow-500/5",
    searchPath: "/api/cartoons/search",
    wantTab: "Хочу посмотреть",
    completedTab: "Просмотрено",
    completedAction: "Просмотрено",
    searchPlaceholder: "Название мультсериала",
    emptyWant: "Добавьте мультсериал в список.",
    emptyCompleted: "Просмотренные мультсериалы появятся здесь.",
    completedSubtitle: "Посмотрели мультсериал",
  },
  anime: {
    kind: "anime",
    label: "Аниме",
    subtitle: "Любимое аниме",
    href: "/memories/anime",
    icon: Sparkles,
    tone: "from-red-500/20 to-red-500/5",
    searchPath: "/api/anime/search",
    wantTab: "Хочу посмотреть",
    completedTab: "Просмотрено",
    completedAction: "Просмотрено",
    searchPlaceholder: "Название аниме",
    emptyWant: "Добавьте аниме в список.",
    emptyCompleted: "Просмотренные аниме появятся здесь.",
    completedSubtitle: "Посмотрели аниме",
  },
};
