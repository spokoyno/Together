"use client";

import { useState, useTransition } from "react";
import { useLanguage } from "@/components/providers/language-provider";
import { EmptyState } from "@/components/ui/empty-state";
import type { HubShoppingNote } from "@/components/features/hub/types";
import { addShoppingNote, closeShoppingNote } from "@/lib/hub/extended-actions";
import { formatDateLocalized } from "@/lib/dates";

type ShoppingPanelProps = {
  notes: HubShoppingNote[];
};

export function ShoppingPanel({ notes }: ShoppingPanelProps) {
  const [draft, setDraft] = useState("");
  const [view, setView] = useState<"open" | "closed">("open");
  const [error, setError] = useState("");
  const [isPending, startTransition] = useTransition();
  const { locale, t } = useLanguage();

  const openNotes = notes.filter((note) => note.status === "open");
  const closedNotes = notes.filter((note) => note.status === "closed");
  const visible = view === "open" ? openNotes : closedNotes;

  function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    startTransition(async () => {
      const result = await addShoppingNote(draft);
      if (!result.ok) {
        setError(result.error ?? t("hubErrorAdd"));
        return;
      }
      setDraft("");
    });
  }

  return (
    <>
      <div className="mb-4 flex gap-2">
        <button
          className={`flex-1 rounded-2xl px-4 py-2.5 text-sm font-semibold ${view === "open" ? "bg-[var(--accent)] text-white" : "surface-input"}`}
          onClick={() => setView("open")}
          type="button"
        >
          {t("hubActiveTab")}
        </button>
        <button
          className={`flex-1 rounded-2xl px-4 py-2.5 text-sm font-semibold ${view === "closed" ? "bg-[var(--accent)] text-white" : "surface-input"}`}
          onClick={() => setView("closed")}
          type="button"
        >
          {t("hubCompletedTab")}
        </button>
      </div>

      {view === "open" ? (
        <form className="mb-5" onSubmit={submit}>
          <textarea
            className="min-h-28 w-full rotate-[-0.5deg] rounded-sm border border-amber-200/80 bg-amber-50 px-4 py-4 text-sm leading-6 shadow-md dark:border-amber-900/40 dark:bg-amber-950/40"
            onChange={(event) => setDraft(event.target.value)}
            placeholder={t("hubShoppingPlaceholder")}
            value={draft}
          />
          {error ? <p className="mt-2 alert-error rounded-xl px-3 py-2 text-sm">{error}</p> : null}
          <button
            className="mt-3 w-full rounded-2xl bg-[var(--accent)] px-4 py-3 font-semibold text-white disabled:opacity-60"
            disabled={isPending || !draft.trim()}
            type="submit"
          >
            {isPending ? t("hubShoppingSticking") : t("hubShoppingStick")}
          </button>
        </form>
      ) : null}

      <section className="grid gap-3">
        {visible.length ? (
          visible.map((note) => (
            <article
              className={`rounded-sm border px-4 py-4 shadow-sm ${
                note.status === "open"
                  ? "rotate-[0.6deg] border-amber-200/80 bg-amber-50 dark:border-amber-900/40 dark:bg-amber-950/40"
                  : "surface-panel opacity-80"
              }`}
              key={note.id}
            >
              <p className="whitespace-pre-wrap text-sm leading-6">{note.body}</p>
              <p className="mt-2 text-xs text-[var(--muted)]">
                {note.status === "closed" && note.closed_by_name
                  ? t("hubBoughtBy", {
                      name: note.closed_by_name,
                      date: formatDateLocalized(
                        locale,
                        note.closed_at?.slice(0, 10) ?? note.created_at.slice(0, 10),
                      ),
                    })
                  : formatDateLocalized(locale, note.created_at.slice(0, 10))}
              </p>
              {note.status === "open" ? (
                <button
                  className="mt-3 rounded-xl bg-[var(--accent-soft)] px-3 py-2 text-xs font-semibold text-[var(--accent)]"
                  disabled={isPending}
                  onClick={() =>
                    startTransition(async () => {
                      await closeShoppingNote(note.id);
                    })
                  }
                  type="button"
                >
                  {t("hubShoppingClose")}
                </button>
              ) : null}
            </article>
          ))
        ) : (
          <EmptyState
            description={view === "open" ? t("hubShoppingEmptyOpen") : t("hubShoppingEmptyClosed")}
            title={t("hubEmptyShort")}
          />
        )}
      </section>
    </>
  );
}
