export type CoupleHoliday = {
  key: string;
  label: string;
  emoji: string;
  month: number;
  day: number;
  year?: number;
};

const FIXED_HOLIDAYS: Omit<CoupleHoliday, "key">[] = [
  { label: "Новый год", emoji: "🎄", month: 1, day: 1 },
  { label: "День святого Валентина", emoji: "💝", month: 2, day: 14 },
  { label: "8 марта", emoji: "🌷", month: 3, day: 8 },
];

function pad(value: number) {
  return value.toString().padStart(2, "0");
}

export function toDateKey(year: number, month: number, day: number) {
  return `${year}-${pad(month)}-${pad(day)}`;
}

export function buildCoupleHolidays(input: {
  year: number;
  myBirthday: string | null;
  partnerBirthday: string | null;
  myName: string;
  partnerName: string;
}): CoupleHoliday[] {
  const holidays: CoupleHoliday[] = FIXED_HOLIDAYS.map((item) => ({
    ...item,
    key: `fixed-${item.month}-${item.day}`,
    year: input.year,
  }));

  if (input.myBirthday) {
    const [, month, day] = input.myBirthday.split("-").map(Number);
    if (month && day) {
      holidays.push({
        key: "my-birthday",
        label: `День рождения ${input.myName}`,
        emoji: "🎂",
        month,
        day,
        year: input.year,
      });
    }
  }

  if (input.partnerBirthday) {
    const [, month, day] = input.partnerBirthday.split("-").map(Number);
    if (month && day) {
      holidays.push({
        key: "partner-birthday",
        label: `День рождения ${input.partnerName}`,
        emoji: "🎁",
        month,
        day,
        year: input.year,
      });
    }
  }

  return holidays;
}

export function holidaysForDay(holidays: CoupleHoliday[], dateKey: string) {
  const [, month, day] = dateKey.split("-").map(Number);
  return holidays.filter((holiday) => holiday.month === month && holiday.day === day);
}
