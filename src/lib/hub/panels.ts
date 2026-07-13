"use client";

import {
  BookOpen,
  ChefHat,
  Clapperboard,
  Heart,
  ListChecks,
  ShoppingBag,
  Sparkles,
  Star,
  Trophy,
  type LucideIcon,
} from "lucide-react";

export type DashboardPanelId =
  | "moments"
  | "movies"
  | "books"
  | "cooking"
  | "compliments"
  | "shopping"
  | "wishlist"
  | "tiers"
  | "polls";

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
];

export function defaultDashboardPreferences(): DashboardPanelPreference[] {
  return DASHBOARD_PANELS.map((panel) => ({ id: panel.id, visible: true }));
}

export function resolveDashboardPanels(
  stored: DashboardPanelPreference[] | null | undefined,
): DashboardPanelConfig[] {
  const prefs = stored?.length ? stored : defaultDashboardPreferences();
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
