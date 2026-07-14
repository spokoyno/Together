"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { Plus, X } from "lucide-react";
import { useLanguage } from "@/components/providers/language-provider";
import { saveMood } from "@/lib/mood/actions";

const EMOJI_OPTIONS = ["✨", "🥰", "😌", "🫶", "🔥", "🌙", "☕", "🎧", "🌸", "💫", "🙂", "😴"];

type CustomMoodButtonProps = {
  customLabel?: string | null;
  customEmoji?: string | null;
  disabled?: boolean;
};

export function CustomMoodButton({ customLabel, customEmoji, disabled }: CustomMoodButtonProps) {
  const { t } = useLanguage();
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [label, setLabel] = useState("");
  const [emoji, setEmoji] = useState("✨");
  const [isPending, startTransition] = useTransition();

  const hasCustom = Boolean(customLabel?.trim());

  function openModal() {
    setLabel(customLabel?.trim() ?? "");
    setEmoji(customEmoji ?? "✨");
    setOpen(true);
  }

  function closeModal() {
    setOpen(false);
  }

  function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const trimmed = label.trim();
    if (!trimmed) {
      return;
    }

    const formData = new FormData();
    formData.set("level", "neutral");
    formData.set("customLabel", trimmed);
    formData.set("customEmoji", emoji);

    startTransition(async () => {
      await saveMood(formData);
      closeModal();
      router.refresh();
    });
  }

  return (
    <>
      {hasCustom ? (
        <button
          className="rounded-full bg-[var(--accent-soft)] px-3 py-2 text-xs font-medium text-[var(--accent)] ring-1 ring-[var(--accent)]/30 transition-colors disabled:opacity-60"
          disabled={disabled || isPending}
          onClick={openModal}
          type="button"
        >
          {customEmoji ?? "✨"} {customLabel}
        </button>
      ) : (
        <button
          className="rounded-full border border-dashed border-[var(--border)] px-3 py-2 text-xs font-medium text-[var(--muted)] transition-colors disabled:opacity-60"
          disabled={disabled || isPending}
          onClick={openModal}
          type="button"
        >
          <Plus aria-hidden className="mr-1 inline size-3.5" />
          {t("moodCustomAdd")}
        </button>
      )}

      {open ? (
        <div className="fixed inset-0 z-50 flex items-end bg-black/40 p-4 pb-24">
          <form className="w-full max-w-md rounded-3xl surface-panel p-5" onSubmit={submit}>
            <div className="mb-4 flex items-center justify-between">
              <p className="text-lg font-semibold">{t("moodCustomTitle")}</p>
              <button
                aria-label={t("commonClose")}
                className="grid size-9 place-items-center rounded-full surface-input"
                onClick={closeModal}
                type="button"
              >
                <X aria-hidden className="size-5" />
              </button>
            </div>

            <label className="grid gap-2">
              <span className="text-sm font-medium">{t("moodCustomLabel")}</span>
              <input
                className="rounded-2xl surface-input px-4 py-3"
                maxLength={40}
                onChange={(event) => setLabel(event.target.value)}
                placeholder={t("moodCustomPlaceholder")}
                required
                value={label}
              />
            </label>

            <p className="mt-4 text-sm font-medium">{t("moodCustomEmoji")}</p>
            <div className="mt-2 flex flex-wrap gap-2">
              {EMOJI_OPTIONS.map((option) => (
                <button
                  className={`grid size-11 place-items-center rounded-2xl text-xl ${
                    emoji === option
                      ? "bg-[var(--accent-soft)] ring-2 ring-[var(--accent)]"
                      : "surface-input"
                  }`}
                  key={option}
                  onClick={() => setEmoji(option)}
                  type="button"
                >
                  {option}
                </button>
              ))}
            </div>

            <button
              className="mt-5 w-full rounded-2xl bg-[var(--accent)] py-3 font-semibold text-white disabled:opacity-60"
              disabled={isPending || !label.trim()}
              type="submit"
            >
              {isPending ? t("commonSaving") : t("commonSave")}
            </button>
          </form>
        </div>
      ) : null}
    </>
  );
}
