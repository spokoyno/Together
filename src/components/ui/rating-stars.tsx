"use client";

import { Star } from "lucide-react";

type RatingInputProps = {
  value: number;
  onChange: (value: number) => void;
  disabled?: boolean;
};

export function RatingInput({ value, onChange, disabled }: RatingInputProps) {
  return (
    <div className="flex items-center gap-3">
      <div className="flex gap-1">
        {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((rating) => (
          <button
            aria-label={`Оценка ${rating}`}
            className="transition-transform active:scale-95 disabled:opacity-50"
            disabled={disabled}
            key={rating}
            onClick={() => onChange(rating)}
            type="button"
          >
            <Star
              aria-hidden
              className={`size-7 ${rating <= value ? "fill-[var(--accent)] text-[var(--accent)]" : "text-[var(--muted)]"}`}
              strokeWidth={1.8}
            />
          </button>
        ))}
      </div>
      <span className="text-lg font-bold tabular-nums">{value}/10</span>
    </div>
  );
}

type RatingDisplayProps = {
  value: number | undefined;
  label?: string;
};

export function RatingDisplay({ value, label }: RatingDisplayProps) {
  if (!value) {
    return <p className="text-sm text-[var(--muted)]">{label ? `${label}: ` : ""}ещё не оценил(а)</p>;
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
