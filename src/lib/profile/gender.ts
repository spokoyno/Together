import type { ProfileGender } from "@/types/domain";

export const PROFILE_GENDER_OPTIONS: { value: ProfileGender; label: string }[] = [
  { value: "female", label: "Женский" },
  { value: "male", label: "Мужской" },
  { value: "other", label: "Другой" },
];

export function genderLabel(gender: ProfileGender | null | undefined): string | null {
  if (!gender) {
    return null;
  }

  return PROFILE_GENDER_OPTIONS.find((option) => option.value === gender)?.label ?? null;
}
