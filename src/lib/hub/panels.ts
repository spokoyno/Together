"use client";

import {
  BookOpen,
  ChefHat,
  Clapperboard,
  Droplets,
  Gamepad2,
  Heart,
  Home,
  Images,
  ListChecks,
  MonitorPlay,
  Plane,
  Repeat,
  ShoppingBag,
  Sparkles,
  Star,
  Timer,
  Trophy,
  Tv,
  Wand2,
  type LucideIcon,
} from "lucide-react";

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

export type DashboardPanelConfig = {
  id: DashboardPanelId;
  label: string;
  description: string;
  href: string;
  icon: LucideIcon;
  tone: string;
};

export type DashboardPanelPreference = {
  id: DashboardPanelId;
  visible: boolean;
};

export const DASHBOARD_PANELS: DashboardPanelConfig[] = [
  {
    id: "movies",
    label: "Фильмы",
    description: "Смотрим вместе",
    href: "/memories/movies",
    icon: Clapperboard,
    tone: "from-sky-500/20 to-sky-500/5",
  },
  {
    id: "games",
    label: "Игры",
    description: "Проходим вместе",
    href: "/memories/games",
    icon: Gamepad2,
    tone: "from-purple-500/20 to-purple-500/5",
  },
  {
    id: "series",
    label: "Сериалы",
    description: "Смотрим вместе",
    href: "/memories/series",
    icon: Tv,
    tone: "from-slate-500/20 to-slate-500/5",
  },
  {
    id: "cartoons",
    label: "Мультсериалы",
    description: "Мультики для двоих",
    href: "/memories/cartoons",
    icon: MonitorPlay,
    tone: "from-yellow-500/20 to-yellow-500/5",
  },
  {
    id: "anime",
    label: "Аниме",
    description: "Любимое аниме",
    href: "/memories/anime",
    icon: Wand2,
    tone: "from-red-500/20 to-red-500/5",
  },
  {
    id: "books",
    label: "Книги",
    description: "Прочитанное",
    href: "/memories/books",
    icon: BookOpen,
    tone: "from-emerald-500/20 to-emerald-500/5",
  },
  {
    id: "cooking",
    label: "Готовка",
    description: "Блюда и рецепты",
    href: "/memories/cooking",
    icon: ChefHat,
    tone: "from-amber-500/20 to-amber-500/5",
  },
  {
    id: "compliments",
    label: "Комплименты",
    description: "Банка тёплых слов",
    href: "/memories/compliments",
    icon: Heart,
    tone: "from-pink-500/20 to-pink-500/5",
  },
  {
    id: "shopping",
    label: "Покупки",
    description: "Общий список",
    href: "/memories/shopping",
    icon: ShoppingBag,
    tone: "from-lime-500/20 to-lime-500/5",
  },
  {
    id: "wishlist",
    label: "Wishlist",
    description: "Желания",
    href: "/memories/wishlist",
    icon: Star,
    tone: "from-fuchsia-500/20 to-fuchsia-500/5",
  },
  {
    id: "tiers",
    label: "Тир-листы",
    description: "TierMaker",
    href: "/memories/tiers",
    icon: Trophy,
    tone: "from-orange-500/20 to-orange-500/5",
  },
  {
    id: "polls",
    label: "Опросы",
    description: "Вопросы партнёру",
    href: "/memories/polls",
    icon: ListChecks,
    tone: "from-indigo-500/20 to-indigo-500/5",
  },
  {
    id: "moments",
    label: "Моменты",
    description: "Фото и заметки",
    href: "/memories/moments",
    icon: Sparkles,
    tone: "from-violet-500/20 to-violet-500/5",
  },
  {
    id: "gallery",
    label: "Галерея",
    description: "Общие фото",
    href: "/memories/gallery",
    icon: Images,
    tone: "from-pink-500/20 to-pink-500/5",
  },
  {
    id: "cycle",
    label: "Месячные",
    description: "Календарь цикла",
    href: "/memories/cycle",
    icon: Droplets,
    tone: "from-rose-500/20 to-rose-500/5",
  },
  {
    id: "travel",
    label: "Путешествия",
    description: "Куда хотим",
    href: "/memories/travel",
    icon: Plane,
    tone: "from-cyan-500/20 to-cyan-500/5",
  },
  {
    id: "chores",
    label: "Дела",
    description: "Домашние задачи",
    href: "/memories/chores",
    icon: Home,
    tone: "from-teal-500/20 to-teal-500/5",
  },
  {
    id: "countdown",
    label: "Отсчёт",
    description: "Важные даты",
    href: "/memories/countdown",
    icon: Timer,
    tone: "from-rose-500/20 to-rose-500/5",
  },
  {
    id: "habits",
    label: "Привычки",
    description: "Вместе каждый день",
    href: "/memories/habits",
    icon: Repeat,
    tone: "from-blue-500/20 to-blue-500/5",
  },
];

export function defaultDashboardPreferences(): DashboardPanelPreference[] {
  return DASHBOARD_PANELS.map((panel) => ({ id: panel.id, visible: true }));
}

export function resolveDashboardPanels(
  stored: DashboardPanelPreference[] | null | undefined,
): DashboardPanelConfig[] {
  const prefs = normalizeDashboardPreferences(stored);
  const panelMap = new Map(DASHBOARD_PANELS.map((panel) => [panel.id, panel]));
  const ordered: DashboardPanelConfig[] = [];

  for (const pref of prefs) {
    if (!pref.visible) {
      continue;
    }
    const panel = panelMap.get(pref.id);
    if (panel) {
      ordered.push(panel);
    }
  }

  for (const panel of DASHBOARD_PANELS) {
    if (!ordered.some((item) => item.id === panel.id) && prefs.find((p) => p.id === panel.id)?.visible !== false) {
      if (!prefs.some((p) => p.id === panel.id)) {
        ordered.push(panel);
      }
    }
  }

  return ordered;
}

export function normalizeDashboardPreferences(
  stored: DashboardPanelPreference[] | null | undefined,
): DashboardPanelPreference[] {
  if (!stored?.length) {
    return defaultDashboardPreferences();
  }

  const known = new Set(DASHBOARD_PANELS.map((panel) => panel.id));
  const cleaned = stored.filter((item) => known.has(item.id));
  for (const panel of DASHBOARD_PANELS) {
    if (!cleaned.some((item) => item.id === panel.id)) {
      cleaned.push({ id: panel.id, visible: true });
    }
  }
  return cleaned;
}
