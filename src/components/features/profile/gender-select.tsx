"use client";

import type { ProfileGender } from "@/types/domain";
import { useLanguage } from "@/components/providers/language-provider";
import type { MessageKey } from "@/lib/i18n/messages";

const GENDER_KEYS: Record<ProfileGender, MessageKey> = {
  female: "genderFemale",
  male: "genderMale",
  other: "genderOther",
};

type GenderSelectProps = {
  value: ProfileGender | "";
  onChange: (value: ProfileGender) => void;
  disabled?: boolean;
};

export function GenderSelect({ value, onChange, disabled }: GenderSelectProps) {
  const { t } = useLanguage();
  const options: ProfileGender[] = ["female", "male", "other"];

  return (
    <div className="grid grid-cols-3 gap-2">
      {options.map((option) => (
        <button
          className={`min-h-11 rounded-2xl px-2 py-2.5 text-sm font-semibold transition-colors disabled:opacity-60 ${
            value === option
              ? "bg-[var(--accent)] text-white"
              : "surface-input text-[var(--foreground)]"
          }`}
          disabled={disabled}
          key={option}
          onClick={() => onChange(option)}
          type="button"
        >
          {t(GENDER_KEYS[option])}
        </button>
      ))}
    </div>
  );
}
