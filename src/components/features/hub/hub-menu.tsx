"use client";

import Link from "next/link";
import { ChefHat, Clapperboard, Heart, ShoppingBag, Sparkles, Star, Trophy } from "lucide-react";
import { useLanguage } from "@/components/providers/language-provider";
import type { MessageKey } from "@/lib/i18n/messages";
import type { HubMenuCounts } from "@/lib/hub/load-data.server";

type HubMenuProps = {
  counts: HubMenuCounts;
};

const tiles = [
  { href: "/memories/moments", labelKey: "panelMoments" as const, descKey: "panelMomentsDesc" as const, icon: Sparkles, countKey: "moments" as const, tone: "from-violet-500/20 to-violet-500/5" },
  { href: "/memories/movies", labelKey: "panelMovies" as const, descKey: "panelMoviesDesc" as const, icon: Clapperboard, countKey: "movies" as const, tone: "from-sky-500/20 to-sky-500/5" },
  { href: "/memories/cooking", labelKey: "panelCooking" as const, descKey: "panelCookingDesc" as const, icon: ChefHat, countKey: "cooking" as const, tone: "from-amber-500/20 to-amber-500/5" },
  { href: "/memories/compliments", labelKey: "panelCompliments" as const, descKey: "panelComplimentsDesc" as const, icon: Heart, countKey: "compliments" as const, tone: "from-pink-500/20 to-pink-500/5" },
  { href: "/memories/shopping", labelKey: "panelShopping" as const, descKey: "panelShoppingDesc" as const, icon: ShoppingBag, countKey: "shopping" as const, tone: "from-lime-500/20 to-lime-500/5" },
  { href: "/memories/wishlist", labelKey: "panelWishlist" as const, descKey: "panelWishlistDesc" as const, icon: Star, countKey: "wishlist" as const, tone: "from-fuchsia-500/20 to-fuchsia-500/5" },
  { href: "/memories/tiers", labelKey: "panelTiers" as const, descKey: "panelTiersDesc" as const, icon: Trophy, countKey: "tiers" as const, tone: "from-orange-500/20 to-orange-500/5" },
] as const;

export function HubMenu({ counts }: HubMenuProps) {
  const { t } = useLanguage();

  return (
    <>
      <header>
        <h1 className="text-2xl font-bold">{t("feedTitle")}</h1>
        <p className="mt-1 text-sm text-[var(--muted)]">{t("hubMenuSubtitle")}</p>
      </header>

      <div className="mt-6 grid grid-cols-2 gap-3">
        {tiles.map((tile) => {
          const Icon = tile.icon;
          const count = counts[tile.countKey];

          return (
            <Link
              className={`group relative flex aspect-square flex-col justify-between overflow-hidden rounded-3xl border border-[var(--border)] bg-gradient-to-br ${tile.tone} p-4 shadow-sm transition-transform active:scale-[0.98]`}
              href={tile.href}
              key={tile.href}
            >
              <div className="flex items-start justify-between gap-2">
                <div className="grid size-12 place-items-center rounded-2xl bg-[var(--surface)]/80 text-[var(--accent)] shadow-sm">
                  <Icon aria-hidden className="size-6" strokeWidth={2.1} />
                </div>
                {count > 0 ? (
                  <span className="rounded-full bg-[var(--accent)] px-2.5 py-1 text-xs font-bold text-white">
                    {count}
                  </span>
                ) : null}
              </div>

              <div>
                <p className="text-base font-bold leading-snug">{t(tile.labelKey as MessageKey)}</p>
                <p className="mt-1 text-xs leading-5 text-[var(--muted)]">{t(tile.descKey as MessageKey)}</p>
              </div>
            </Link>
          );
        })}
      </div>
    </>
  );
}
