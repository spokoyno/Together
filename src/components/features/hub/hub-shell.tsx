"use client";

import { useState } from "react";
import { ChefHat, Clapperboard, Heart, Sparkles } from "lucide-react";
import { ComplimentsPanel } from "@/components/features/hub/compliments-panel";
import { CookingPanel } from "@/components/features/hub/cooking-panel";
import { MomentsPanel } from "@/components/features/hub/moments-panel";
import { MoviesPanel } from "@/components/features/hub/movies-panel";
import type { HubComplimentState, HubCookingDish, HubMemory, HubMovie } from "@/components/features/hub/types";

type HubTab = "moments" | "movies" | "cooking" | "compliments";

type HubShellProps = {
  memories: HubMemory[];
  movies: HubMovie[];
  dishes: HubCookingDish[];
  complimentState: HubComplimentState;
  coupleId: string;
  userId: string;
  partnerId: string;
  partnerName: string;
};

const tabs: { id: HubTab; label: string; icon: typeof Sparkles }[] = [
  { id: "moments", label: "Моменты", icon: Sparkles },
  { id: "movies", label: "Фильмы", icon: Clapperboard },
  { id: "cooking", label: "Готовка", icon: ChefHat },
  { id: "compliments", label: "Комплименты", icon: Heart },
];

export function HubShell({
  memories,
  movies,
  dishes,
  complimentState,
  coupleId,
  userId,
  partnerId,
  partnerName,
}: HubShellProps) {
  const [tab, setTab] = useState<HubTab>("moments");

  return (
    <>
      <header>
        <h1 className="text-2xl font-bold">Лента</h1>
        <p className="mt-1 text-sm text-[var(--muted)]">Моменты, фильмы, готовка и комплименты</p>
      </header>

      <div className="mt-5 flex gap-2 overflow-x-auto pb-1 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        {tabs.map((item) => {
          const Icon = item.icon;
          const active = tab === item.id;

          return (
            <button
              className={`inline-flex shrink-0 items-center gap-2 rounded-2xl px-4 py-2.5 text-sm font-semibold transition-colors ${
                active
                  ? "bg-[var(--accent)] text-white"
                  : "surface-input text-[var(--muted)]"
              }`}
              key={item.id}
              onClick={() => setTab(item.id)}
              type="button"
            >
              <Icon aria-hidden className="size-4" />
              {item.label}
            </button>
          );
        })}
      </div>

      <div className="mt-6">
        {tab === "moments" ? (
          <MomentsPanel
            coupleId={coupleId}
            memories={memories}
            userId={userId}
          />
        ) : null}
        {tab === "movies" ? (
          <MoviesPanel
            movies={movies}
            partnerId={partnerId}
            partnerName={partnerName}
            userId={userId}
          />
        ) : null}
        {tab === "cooking" ? (
          <CookingPanel
            coupleId={coupleId}
            dishes={dishes}
            userId={userId}
          />
        ) : null}
        {tab === "compliments" ? (
          <ComplimentsPanel
            partnerName={partnerName}
            state={complimentState}
          />
        ) : null}
      </div>
    </>
  );
}
