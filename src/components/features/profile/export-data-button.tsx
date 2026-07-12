"use client";

import { useState, useTransition } from "react";
import { exportCoupleData } from "@/lib/profile/actions";

export function ExportDataButton() {
  const [error, setError] = useState("");
  const [isPending, startTransition] = useTransition();

  function handleExport() {
    setError("");
    startTransition(async () => {
      const result = await exportCoupleData();
      if (!result.ok) {
        setError(result.error);
        return;
      }

      const blob = new Blob([result.json], { type: "application/json" });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `together-export-${new Date().toISOString().slice(0, 10)}.json`;
      link.click();
      URL.revokeObjectURL(url);
    });
  }

  return (
    <div>
      <button
        className="w-full rounded-2xl border border-[var(--border)] bg-white px-5 py-4 font-semibold disabled:opacity-60"
        disabled={isPending}
        onClick={handleExport}
        type="button"
      >
        {isPending ? "Готовим файл..." : "Экспортировать мои данные"}
      </button>
      {error ? <p className="mt-2 text-sm text-red-600">{error}</p> : null}
    </div>
  );
}
