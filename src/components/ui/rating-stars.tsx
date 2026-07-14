"use client";

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
      <div className="flex flex-wrap gap-1.5">
        {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((rating) => (
          <button
            aria-label={`${t("ratingLabel")} ${rating}`}
            aria-pressed={rating === value}
            className={`grid size-9 place-items-center rounded-xl text-sm font-bold tabular-nums transition-transform active:scale-95 disabled:opacity-50 ${
              rating === value
                ? "bg-[var(--accent)] text-white"
                : "surface-input text-[var(--foreground)]"
            }`}
            disabled={disabled}
            key={rating}
            onClick={() => onChange(rating)}
            type="button"
          >
            {rating}
          </button>
        ))}
      </div>
      <p className="mt-2 text-sm font-semibold tabular-nums text-[var(--muted)]">
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
    <p className="text-sm">
      {label ? <span className="text-[var(--muted)]">{label}: </span> : null}
      <span className="font-semibold tabular-nums">{value}/10</span>
    </p>
  );
}
