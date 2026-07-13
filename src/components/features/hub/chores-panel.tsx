"use client";

import { Plus } from "lucide-react";
import { useMemo, useState, useTransition } from "react";
import { EmptyState } from "@/components/ui/empty-state";
import type { HubChore } from "@/components/features/hub/types";
import { addChore, completeChore } from "@/lib/hub/lifestyle-actions";
import { formatDateRu } from "@/lib/dates";

type ChoreMember = {
  id: string;
  name: string;
};

type ChoresPanelProps = {
  chores: HubChore[];
  members: ChoreMember[];
};

type ChoresView = "pending" | "done";

export function ChoresPanel({ chores, members }: ChoresPanelProps) {
  const [view, setView] = useState<ChoresView>("pending");
  const [showCreate, setShowCreate] = useState(false);
  const [title, setTitle] = useState("");
  const [dueDate, setDueDate] = useState("");
  const [assignedTo, setAssignedTo] = useState("");
  const [error, setError] = useState("");
  const [isPending, startTransition] = useTransition();

  const pending = useMemo(
    () => chores.filter((chore) => chore.status === "pending"),
    [chores],
  );
  const done = useMemo(
    () => chores.filter((chore) => chore.status === "done"),
    [chores],
  );
  const visible = view === "pending" ? pending : done;

  function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    startTransition(async () => {
      const result = await addChore(
        title,
        dueDate || undefined,
        assignedTo || null,
      );
      if (!result.ok) {
        setError(result.error ?? "Не удалось добавить.");
        return;
      }
      setShowCreate(false);
      setTitle("");
      setDueDate("");
      setAssignedTo("");
    });
  }

  return (
    <>
      <div className="mb-4 flex gap-2">
        <button
          className={`flex-1 rounded-2xl px-4 py-2.5 text-sm font-semibold ${view === "pending" ? "bg-[var(--accent)] text-white" : "surface-input"}`}
          onClick={() => setView("pending")}
          type="button"
        >
          Запланировано
        </button>
        <button
          className={`flex-1 rounded-2xl px-4 py-2.5 text-sm font-semibold ${view === "done" ? "bg-[var(--accent)] text-white" : "surface-input"}`}
          onClick={() => setView("done")}
          type="button"
        >
          Выполнено
        </button>
      </div>

      <section className="grid gap-3">
        {visible.length ? (
          visible.map((chore) => (
            <article className="rounded-3xl surface-panel p-4" key={chore.id}>
              <p className="font-bold">{chore.title}</p>
              <p className="mt-2 text-xs text-[var(--muted)]">
                {chore.status === "done" && chore.completed_by_name
                  ? `Сделал(а) ${chore.completed_by_name} · ${formatDateRu(chore.completed_at?.slice(0, 10) ?? chore.created_at.slice(0, 10))}`
                  : [
                      chore.assigned_to_name ? `Исполнитель: ${chore.assigned_to_name}` : null,
                      chore.due_date ? `Срок: ${formatDateRu(chore.due_date)}` : null,
                      chore.author_name,
                    ]
                      .filter(Boolean)
                      .join(" · ")}
              </p>
              {chore.status === "pending" ? (
                <button
                  className="mt-3 rounded-xl bg-[var(--accent-soft)] px-3 py-2 text-xs font-semibold text-[var(--accent)]"
                  disabled={isPending}
                  onClick={() =>
                    startTransition(async () => {
                      await completeChore(chore.id);
                    })
                  }
                  type="button"
                >
                  Готово
                </button>
              ) : null}
            </article>
          ))
        ) : (
          <EmptyState
            description={
              view === "pending"
                ? "Добавьте домашнее дело для пары."
                : "Выполненные задачи появятся здесь."
            }
            title="Пока пусто"
          />
        )}
      </section>

      {view === "pending" ? (
        <button
          aria-label="Добавить дело"
          className="fixed bottom-[calc(max(0.75rem,env(safe-area-inset-bottom))+5.25rem)] right-5 z-30 grid size-14 place-items-center rounded-full bg-[var(--accent)] text-white shadow-lg"
          onClick={() => setShowCreate(true)}
          type="button"
        >
          <Plus aria-hidden className="size-7" />
        </button>
      ) : null}

      {showCreate ? (
        <div className="fixed inset-0 z-50 flex items-end bg-black/40 p-4 pb-24">
          <form className="w-full rounded-3xl surface-panel p-5" onSubmit={submit}>
            <p className="text-lg font-bold">Новое дело</p>
            <div className="mt-3 grid gap-3">
              <input
                className="rounded-2xl surface-input px-4 py-3"
                onChange={(event) => setTitle(event.target.value)}
                placeholder="Что нужно сделать?"
                required
                value={title}
              />
              <input
                className="rounded-2xl surface-input px-4 py-3"
                onChange={(event) => setDueDate(event.target.value)}
                type="date"
                value={dueDate}
              />
              <select
                className="rounded-2xl surface-input px-4 py-3"
                onChange={(event) => setAssignedTo(event.target.value)}
                value={assignedTo}
              >
                <option value="">Справедливо (авто)</option>
                {members.map((member) => (
                  <option key={member.id} value={member.id}>
                    {member.name}
                  </option>
                ))}
              </select>
              {error ? <p className="alert-error rounded-xl px-3 py-2 text-sm">{error}</p> : null}
              <button
                className="rounded-2xl bg-[var(--accent)] py-3 font-semibold text-white disabled:opacity-60"
                disabled={isPending}
                type="submit"
              >
                Добавить
              </button>
            </div>
          </form>
        </div>
      ) : null}
    </>
  );
}
