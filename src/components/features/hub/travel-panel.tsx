"use client";

import { MapPin, Plus } from "lucide-react";
import { useMemo, useState, useTransition } from "react";
import { useLanguage } from "@/components/providers/language-provider";
import { EmptyState } from "@/components/ui/empty-state";
import { ConfirmDeleteButton } from "@/components/ui/confirm-delete-button";
import { ModalSheet } from "@/components/ui/modal-sheet";
import type { HubTravelDestination } from "@/components/features/hub/types";
import { addTravelDestination, deleteTravelDestination, markTravelDone } from "@/lib/hub/lifestyle-actions";
import { formatDateLocalized } from "@/lib/dates";
import { TRAVEL_COUNTRIES } from "@/lib/travel/countries";

type TravelPanelProps = {
  destinations: HubTravelDestination[];
};

type TravelTab = "planned" | "completed";

export function TravelPanel({ destinations }: TravelPanelProps) {
  const [tab, setTab] = useState<TravelTab>("planned");
  const [showCreate, setShowCreate] = useState(false);
  const [country, setCountry] = useState("");
  const [description, setDescription] = useState("");
  const [plannedDate, setPlannedDate] = useState("");
  const [error, setError] = useState("");
  const [isPending, startTransition] = useTransition();
  const { locale, t } = useLanguage();

  const plannedItems = useMemo(
    () => destinations.filter((item) => item.status === "planned"),
    [destinations],
  );
  const completedItems = useMemo(
    () => destinations.filter((item) => item.status === "completed"),
    [destinations],
  );
  const visible = tab === "planned" ? plannedItems : completedItems;

  function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    startTransition(async () => {
      const result = await addTravelDestination(country, description, plannedDate || undefined);
      if (!result.ok) {
        setError(result.error ?? t("hubErrorAdd"));
        return;
      }
      setShowCreate(false);
      setCountry("");
      setDescription("");
      setPlannedDate("");
    });
  }

  return (
    <>
      <div className="mb-4 flex gap-2">
        <button
          className={`flex-1 rounded-2xl px-4 py-2.5 text-sm font-semibold ${tab === "planned" ? "bg-[var(--accent)] text-white" : "surface-input"}`}
          onClick={() => setTab("planned")}
          type="button"
        >
          {t("hubPlannedTab")}
        </button>
        <button
          className={`flex-1 rounded-2xl px-4 py-2.5 text-sm font-semibold ${tab === "completed" ? "bg-[var(--accent)] text-white" : "surface-input"}`}
          onClick={() => setTab("completed")}
          type="button"
        >
          {t("hubFulfilledTab")}
        </button>
      </div>

      <section className="grid gap-3">
        {visible.length ? (
          visible.map((item) => (
            <article className="rounded-3xl surface-panel p-4" key={item.id}>
              <div className="flex items-start gap-3">
                <div className="grid size-11 shrink-0 place-items-center rounded-2xl bg-[var(--accent-soft)] text-[var(--accent)]">
                  <MapPin aria-hidden className="size-5" />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-start justify-between gap-2">
                    <p className="font-bold leading-snug">{item.country}</p>
                    <ConfirmDeleteButton
                      disabled={isPending}
                      onConfirm={() =>
                        startTransition(async () => {
                          await deleteTravelDestination(item.id);
                        })
                      }
                    />
                  </div>
                  {item.description ? (
                    <p className="mt-1 text-sm text-[var(--muted)]">{item.description}</p>
                  ) : null}
                  <p className="mt-2 text-xs text-[var(--muted)]">
                    {item.author_name}
                    {item.planned_date ? ` · ${formatDateLocalized(locale, item.planned_date)}` : ""}
                    {item.completed_at
                      ? ` · ${formatDateLocalized(locale, item.completed_at.slice(0, 10))}`
                      : ""}
                  </p>
                  {item.status === "planned" ? (
                    <button
                      className="mt-3 rounded-xl bg-[var(--accent-soft)] px-3 py-2 text-xs font-semibold text-[var(--accent)]"
                      disabled={isPending}
                      onClick={() =>
                        startTransition(async () => {
                          await markTravelDone(item.id);
                        })
                      }
                      type="button"
                    >
                      {t("hubTravelMarkDone")}
                    </button>
                  ) : null}
                </div>
              </div>
            </article>
          ))
        ) : (
          <EmptyState
            description={
              tab === "planned" ? t("hubTravelEmptyOpen") : t("hubTravelEmptyClosed")
            }
            title={t("hubEmptyShort")}
          />
        )}
      </section>

      {tab === "planned" ? (
        <button
          aria-label={t("hubTravelAdd")}
          className="fixed bottom-[calc(max(0.75rem,env(safe-area-inset-bottom))+5.25rem)] right-5 z-30 grid size-14 place-items-center rounded-full bg-[var(--accent)] text-white shadow-lg"
          onClick={() => setShowCreate(true)}
          type="button"
        >
          <Plus aria-hidden className="size-7" />
        </button>
      ) : null}

      {showCreate ? (
        <ModalSheet as="form" onClose={() => setShowCreate(false)} onSubmit={submit} open>
            <p className="text-lg font-bold">{t("hubTravelNew")}</p>
            <div className="mt-3 grid gap-3">
              <select
                className="rounded-2xl surface-input px-4 py-3"
                onChange={(event) => setCountry(event.target.value)}
                required
                value={country}
              >
                <option disabled value="">
                  {t("hubTravelSelectCountry")}
                </option>
                {TRAVEL_COUNTRIES.map((name) => (
                  <option key={name} value={name}>
                    {name}
                  </option>
                ))}
              </select>
              <textarea
                className="min-h-20 rounded-2xl surface-input px-4 py-3"
                onChange={(event) => setDescription(event.target.value)}
                placeholder={t("commonDescriptionOptional")}
                value={description}
              />
              <input
                className="rounded-2xl surface-input px-4 py-3"
                onChange={(event) => setPlannedDate(event.target.value)}
                type="date"
                value={plannedDate}
              />
              <p className="text-xs text-[var(--muted)]">{t("hubDateCalendarHint")}</p>
              {error ? <p className="alert-error rounded-xl px-3 py-2 text-sm">{error}</p> : null}
              <button
                className="rounded-2xl bg-[var(--accent)] py-3 font-semibold text-white disabled:opacity-60"
                disabled={isPending}
                type="submit"
              >
                {t("commonAdd")}
              </button>
            </div>
        </ModalSheet>
      ) : null}
    </>
  );
}
