"use client";

import { EmptyState } from "@/components/ui/empty-state";
import { useLanguage } from "@/components/providers/language-provider";
import { daysUntil, formatDateTimeLocalized } from "@/lib/dates";
import { createEvent, deleteEvent } from "@/lib/memories/actions";

type EventRow = {
  id: string;
  title: string;
  starts_at: string;
};

type EventsPageContentProps = {
  upcoming: EventRow[];
  past: EventRow[];
};

export function EventsPageContent({ upcoming, past }: EventsPageContentProps) {
  const { locale, t } = useLanguage();

  return (
    <>
      <h1 className="text-3xl font-semibold">{t("eventsPageTitle")}</h1>
      <p className="mt-3 leading-7 text-[var(--muted)]">{t("eventsPageHint")}</p>

      <form action={createEvent} className="mt-8 grid gap-3 rounded-[1.75rem] surface-panel p-5">
        <p className="font-semibold">{t("eventsNew")}</p>
        <input
          className="rounded-2xl surface-input px-4 py-3"
          name="title"
          placeholder={t("eventsTitlePlaceholder")}
          required
        />
        <input className="rounded-2xl surface-input px-4 py-3" name="startsAt" required type="datetime-local" />
        <button
          className="rounded-2xl bg-[var(--accent)] px-4 py-3 font-semibold text-white"
          type="submit"
        >
          {t("commonAdd")}
        </button>
      </form>

      <section className="mt-8">
        <h2 className="text-lg font-semibold">{t("eventsUpcoming")}</h2>
        <div className="mt-4 grid gap-3">
          {upcoming.length ? (
            upcoming.map((event) => (
              <article className="rounded-[1.75rem] surface-panel p-4" key={event.id}>
                <p className="font-semibold">{event.title}</p>
                <p className="mt-2 text-sm text-[var(--muted)]">
                  {formatDateTimeLocalized(locale, event.starts_at)}
                </p>
                <p className="mt-1 text-sm font-medium text-[var(--accent)]">
                  {t("eventsInDays", { days: daysUntil(event.starts_at.slice(0, 10)) })}
                </p>
                <form action={deleteEvent.bind(null, event.id)} className="mt-4">
                  <button className="text-sm text-[var(--muted)]" type="submit">
                    {t("commonDelete")}
                  </button>
                </form>
              </article>
            ))
          ) : (
            <EmptyState description={t("eventsEmptyDesc")} title={t("eventsEmpty")} />
          )}
        </div>
      </section>

      {past.length ? (
        <section className="mt-8">
          <h2 className="text-lg font-semibold">{t("eventsPast")}</h2>
          <div className="mt-4 grid gap-3">
            {past.map((event) => (
              <article className="rounded-[1.75rem] surface-panel p-4 opacity-75" key={event.id}>
                <p className="font-semibold">{event.title}</p>
                <p className="mt-2 text-sm text-[var(--muted)]">
                  {formatDateTimeLocalized(locale, event.starts_at)}
                </p>
              </article>
            ))}
          </div>
        </section>
      ) : null}
    </>
  );
}
