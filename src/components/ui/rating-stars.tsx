"use client";

import { ChevronDown, Star } from "lucide-react";
import { useEffect, useId, useRef, useState } from "react";
import { useLanguage } from "@/components/providers/language-provider";

type RatingInputProps = {
  value: number;
  onChange: (value: number) => void;
  disabled?: boolean;
};

const RATINGS = [10, 9, 8, 7, 6, 5, 4, 3, 2, 1] as const;

function starOpacity(rating: number) {
  return 0.35 + rating * 0.065;
}

export function RatingInput({ value, onChange, disabled }: RatingInputProps) {
  const { t } = useLanguage();
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);
  const listId = useId();

  useEffect(() => {
    if (!open) {
      return;
    }

    function handlePointerDown(event: MouseEvent) {
      if (!rootRef.current?.contains(event.target as Node)) {
        setOpen(false);
      }
    }

    document.addEventListener("mousedown", handlePointerDown);
    return () => document.removeEventListener("mousedown", handlePointerDown);
  }, [open]);

  return (
    <div className="relative w-full min-w-0" ref={rootRef}>
      <button
        aria-expanded={open}
        aria-haspopup="listbox"
        aria-label={t("ratingLabel")}
        className="flex min-h-11 w-full items-center justify-between gap-3 rounded-2xl surface-input px-4 py-2.5 transition-colors active:scale-[0.99] disabled:opacity-50"
        disabled={disabled}
        onClick={() => setOpen((current) => !current)}
        type="button"
      >
        <span className="inline-flex items-center gap-2.5">
          <Star
            aria-hidden
            className="size-5 fill-[var(--accent)] text-[var(--accent)]"
            style={{ opacity: starOpacity(value) }}
          />
          <span className="text-base font-bold tabular-nums">{value}</span>
          <span className="text-sm font-medium text-[var(--muted)]">/10</span>
        </span>
        <ChevronDown
          aria-hidden
          className={`size-4 shrink-0 text-[var(--muted)] transition-transform duration-200 ${open ? "rotate-180" : ""}`}
        />
      </button>

      {open ? (
        <ul
          className="absolute z-50 mt-2 max-h-56 w-full overflow-y-auto rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-1.5 shadow-[0_12px_40px_rgba(0,0,0,0.18)]"
          id={listId}
          role="listbox"
        >
          {RATINGS.map((rating) => {
            const selected = rating === value;

            return (
              <li aria-selected={selected} key={rating} role="option">
                <button
                  className={`flex w-full items-center justify-between rounded-xl px-3.5 py-2.5 transition-colors ${
                    selected
                      ? "bg-[var(--accent-soft)]"
                      : "hover:bg-[var(--input-bg)] active:bg-[var(--input-bg)]"
                  }`}
                  onClick={() => {
                    onChange(rating);
                    setOpen(false);
                  }}
                  type="button"
                >
                  <Star
                    aria-hidden
                    className={`size-4 ${selected ? "fill-[var(--accent)] text-[var(--accent)]" : "fill-[var(--accent)] text-[var(--accent)]"}`}
                    style={{ opacity: starOpacity(rating) }}
                  />
                  <span
                    className={`text-sm font-bold tabular-nums ${selected ? "text-[var(--accent)]" : "text-[var(--foreground)]"}`}
                  >
                    {rating}
                  </span>
                </button>
              </li>
            );
          })}
        </ul>
      ) : null}
    </div>
  );
}

type RatingDisplayProps = {
  value: number | undefined;
  label?: string;
};

export function RatingDisplay({ value, label }: RatingDisplayProps) {
  const { t } = useLanguage();

  if (!value) {
    return (
      <p className="text-sm text-[var(--muted)]">
        {label ? `${label}: ` : ""}
        {t("ratingNotYet")}
      </p>
    );
  }

  return (
    <p className="inline-flex items-center gap-1.5 text-sm">
      {label ? <span className="text-[var(--muted)]">{label}:</span> : null}
      <span className="inline-flex items-center gap-1.5 font-semibold tabular-nums">
        <Star
          aria-hidden
          className="size-4 fill-[var(--accent)] text-[var(--accent)]"
          style={{ opacity: starOpacity(value) }}
        />
        {value}/10
      </span>
    </p>
  );
}
