"use client";

import Link from "next/link";
import { Settings2 } from "lucide-react";
import { useState, useTransition } from "react";
import type { DashboardPanelConfig, DashboardPanelPreference } from "@/lib/hub/panels";
import { DASHBOARD_PANELS, normalizeDashboardPreferences } from "@/lib/hub/panels";
import { saveDashboardPanels } from "@/lib/profile/actions";

type DashboardPanelsProps = {
  panels: DashboardPanelConfig[];
  preferences: DashboardPanelPreference[];
};

export function DashboardPanels({ panels, preferences }: DashboardPanelsProps) {
  const [showEditor, setShowEditor] = useState(false);
  const [draft, setDraft] = useState(normalizeDashboardPreferences(preferences));
  const [isPending, startTransition] = useTransition();

  function movePanel(id: string, direction: -1 | 1) {
    setDraft((current) => {
      const index = current.findIndex((item) => item.id === id);
      if (index < 0) {
        return current;
      }
      const nextIndex = index + direction;
      if (nextIndex < 0 || nextIndex >= current.length) {
        return current;
      }
      const copy = [...current];
      const [item] = copy.splice(index, 1);
      copy.splice(nextIndex, 0, item);
      return copy;
    });
  }

  function togglePanel(id: string) {
    setDraft((current) =>
      current.map((item) => (item.id === id ? { ...item, visible: !item.visible } : item)),
    );
  }

  function savePreferences() {
    startTransition(async () => {
      await saveDashboardPanels(draft);
      setShowEditor(false);
    });
  }

  return (
    <section className="mt-5">
      <div className="mb-3 flex items-center justify-between">
        <p className="font-semibold">Разделы</p>
        <button
          className="inline-flex items-center gap-1 rounded-xl surface-input px-3 py-2 text-xs font-semibold"
          onClick={() => {
            setDraft(normalizeDashboardPreferences(preferences));
            setShowEditor(true);
          }}
          type="button"
        >
          <Settings2 aria-hidden className="size-3.5" />
          Настроить
        </button>
      </div>

      <div className="grid grid-cols-2 gap-3">
        {panels.map((panel) => {
          const Icon = panel.icon;
          return (
            <Link
              className={`flex aspect-[1.15] flex-col justify-between overflow-hidden rounded-3xl border border-[var(--border)] bg-gradient-to-br ${panel.tone} p-4 transition-transform active:scale-[0.98]`}
              href={panel.href}
              key={panel.id}
            >
              <div className="grid size-11 place-items-center rounded-2xl bg-[var(--surface)]/80 text-[var(--accent)]">
                <Icon aria-hidden className="size-5" />
              </div>
              <div>
                <p className="font-bold">{panel.label}</p>
                <p className="mt-1 text-xs text-[var(--muted)]">{panel.description}</p>
              </div>
            </Link>
          );
        })}
      </div>

      {showEditor ? (
        <div className="fixed inset-0 z-50 flex items-end bg-black/40 p-4 pb-24">
          <div className="max-h-[80vh] w-full overflow-y-auto rounded-3xl surface-panel p-5">
            <p className="text-lg font-bold">Панели на главной</p>
            <p className="mt-1 text-sm text-[var(--muted)]">Показывать, скрывать и менять порядок</p>
            <ul className="mt-4 space-y-2">
              {draft.map((item, index) => {
                const panel = DASHBOARD_PANELS.find((entry) => entry.id === item.id);
                if (!panel) {
                  return null;
                }
                return (
                  <li className="flex items-center gap-2 rounded-2xl surface-input p-3" key={item.id}>
                    <input checked={item.visible} onChange={() => togglePanel(item.id)} type="checkbox" />
                    <span className="min-w-0 flex-1 truncate text-sm font-semibold">{panel.label}</span>
                    <button
                      className="rounded-lg px-2 py-1 text-xs disabled:opacity-40"
                      disabled={index === 0}
                      onClick={() => movePanel(item.id, -1)}
                      type="button"
                    >
                      ↑
                    </button>
                    <button
                      className="rounded-lg px-2 py-1 text-xs disabled:opacity-40"
                      disabled={index === draft.length - 1}
                      onClick={() => movePanel(item.id, 1)}
                      type="button"
                    >
                      ↓
                    </button>
                  </li>
                );
              })}
            </ul>
            <div className="mt-4 grid grid-cols-2 gap-2">
              <button className="rounded-2xl surface-input py-3 font-semibold" onClick={() => setShowEditor(false)} type="button">
                Отмена
              </button>
              <button className="rounded-2xl bg-[var(--accent)] py-3 font-semibold text-white disabled:opacity-60" disabled={isPending} onClick={savePreferences} type="button">
                Сохранить
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </section>
  );
}
