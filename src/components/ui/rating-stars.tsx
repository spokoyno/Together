"use client";

import { Star } from "lucide-react";
import { useLanguage } from "@/components/providers/language-provider";

type RatingInputProps = {
  value: number;
  onChange: (value: number) => void;
  disabled?: boolean;
};

export function RatingInput({ value, onChange, disabled }: RatingInputProps) {
  const { t } = useLanguage();

  return (
    <div className="w-full min-w-0">
      <div className="grid grid-cols-5 gap-1 sm:grid-cols-10">
        {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((rating) => (
          <button
            aria-label={`${t("ratingLabel")} ${rating}`}
            className="grid min-h-10 min-w-0 place-items-center rounded-xl transition-transform active:scale-95 disabled:opacity-50"
            disabled={disabled}
            key={rating}
            onClick={() => onChange(rating)}
            type="button"
          >
            <Star
              aria-hidden
              className={`size-5 sm:size-6 ${
                rating <= value ? "fill-[var(--accent)] text-[var(--accent)]" : "text-[var(--muted)]"
              }`}
              strokeWidth={1.8}
            />
          </button>
        ))}
      </div>
      <p className="mt-2 text-center text-sm font-bold tabular-nums">
        {value}/10
      </p>
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
    <p className="inline-flex items-center gap-1 text-sm">
      {label ? <span className="text-[var(--muted)]">{label}:</span> : null}
      <span className="inline-flex items-center gap-0.5 font-semibold">
        {value}/10
        <Star aria-hidden className="size-4 fill-[var(--accent)] text-[var(--accent)]" />
      </span>
    </p>
  );
}
