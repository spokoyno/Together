"use client";

import type { ProfileGender } from "@/types/domain";
import { PROFILE_GENDER_OPTIONS } from "@/lib/profile/gender";

type GenderSelectProps = {
  value: ProfileGender | "";
  onChange: (value: ProfileGender) => void;
  disabled?: boolean;
};

export function GenderSelect({ value, onChange, disabled }: GenderSelectProps) {
  return (
    <div className="grid grid-cols-3 gap-2">
      {PROFILE_GENDER_OPTIONS.map((option) => (
        <button
          className={`min-h-11 rounded-2xl px-2 py-2.5 text-sm font-semibold transition-colors disabled:opacity-60 ${
            value === option.value
              ? "bg-[var(--accent)] text-white"
              : "surface-input text-[var(--foreground)]"
          }`}
          disabled={disabled}
          key={option.value}
          onClick={() => onChange(option.value)}
          type="button"
        >
          {option.label}
        </button>
      ))}
    </div>
  );
}
