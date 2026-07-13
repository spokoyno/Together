"use client";

import Link from "next/link";
import { Settings2 } from "lucide-react";
import { useMemo, useState, useTransition } from "react";
import { useLanguage } from "@/components/providers/language-provider";
import { PANEL_DESC_KEYS, PANEL_LABEL_KEYS } from "@/lib/i18n/panel-keys";
import type { DashboardPanelPreference } from "@/lib/hub/panels";
import {
  DASHBOARD_PANELS,
  normalizeDashboardPreferences,
  resolveDashboardPanels,
} from "@/lib/hub/panels";
import { saveDashboardPanels } from "@/lib/profile/actions";

type DashboardPanelsProps = {
  preferences: DashboardPanelPreference[];
};

export function DashboardPanels({ preferences }: DashboardPanelsProps) {
  const { t } = useLanguage();
  const panels = useMemo(() => resolveDashboardPanels(preferences), [preferences]);
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
    <section className="mt-6">
      <div className="mb-3 flex items-center justify-between gap-3">
        <p className="text-sm font-medium text-[var(--muted)]">{t("dashboardSections")}</p>
        <button
          className="inline-flex items-center gap-1 rounded-full border border-[var(--border)] bg-[var(--surface)] px-3 py-1.5 text-xs font-medium text-[var(--muted)]"
          onClick={() => {
            setDraft(normalizeDashboardPreferences(preferences));
            setShowEditor(true);
          }}
          type="button"
        >
          <Settings2 aria-hidden className="size-3.5" />
          {t("dashboardCustomize")}
        </button>
      </div>

      <div className="flex flex-col gap-2.5">
        {panels.map((panel, index) => {
          const Icon = panel.icon;
          const wide = index % 5 === 0;
          return (
            <Link
              className={`dashboard-panel-card flex items-center gap-3.5 rounded-[1.35rem] p-3.5 ${
                wide ? "py-4" : ""
              }`}
              href={panel.href}
              key={panel.id}
            >
              <div className="grid size-11 shrink-0 place-items-center rounded-2xl bg-[var(--accent-soft)] text-[var(--accent)]">
                <Icon aria-hidden className="size-5" strokeWidth={1.8} />
              </div>
              <div className="min-w-0 flex-1">
                <p className="font-semibold leading-snug">{t(PANEL_LABEL_KEYS[panel.id])}</p>
                <p className="mt-0.5 line-clamp-1 text-xs text-[var(--muted)]">
                  {t(PANEL_DESC_KEYS[panel.id])}
                </p>
              </div>
              <span aria-hidden className="pr-1 text-sm text-[var(--muted)]">
                ›
              </span>
            </Link>
          );
        })}
      </div>

      {showEditor ? (
        <div className="fixed inset-0 z-50 flex items-end bg-black/50 p-4 pb-24">
          <div className="max-h-[80vh] w-full overflow-y-auto rounded-3xl surface-panel p-5">
            <p className="text-lg font-semibold">{t("dashboardPanelsTitle")}</p>
            <p className="mt-1 text-sm text-[var(--muted)]">{t("dashboardPanelsHint")}</p>
            <ul className="mt-4 space-y-2">
              {draft.map((item, index) => {
                const panel = DASHBOARD_PANELS.find((entry) => entry.id === item.id);
                if (!panel) {
                  return null;
                }
                return (
                  <li className="flex items-center gap-2 rounded-2xl surface-input p-3" key={item.id}>
                    <input checked={item.visible} onChange={() => togglePanel(item.id)} type="checkbox" />
                    <span className="min-w-0 flex-1 truncate text-sm font-medium">
                      {t(PANEL_LABEL_KEYS[panel.id])}
                    </span>
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
              <button
                className="rounded-2xl surface-input py-3 font-semibold"
                onClick={() => setShowEditor(false)}
                type="button"
              >
                {t("commonCancel")}
              </button>
              <button
                className="rounded-2xl bg-[var(--accent)] py-3 font-semibold text-[var(--background)] disabled:opacity-60"
                disabled={isPending}
                onClick={savePreferences}
                type="button"
              >
                {t("commonSave")}
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </section>
  );
}
