export function addDays(isoDate: string, days: number): string {
  const date = new Date(`${isoDate}T12:00:00`);
  date.setDate(date.getDate() + days);
  return date.toISOString().slice(0, 10);
}

export function buildPeriodDaySet(input: {
  lastPeriodStart: string;
  cycleLengthDays: number;
  periodLengthDays: number;
  rangeStart: string;
  rangeEnd: string;
}): Set<string> {
  const days = new Set<string>();
  if (!input.lastPeriodStart) {
    return days;
  }

  let cycleStart = input.lastPeriodStart;

  while (cycleStart > input.rangeStart) {
    cycleStart = addDays(cycleStart, -input.cycleLengthDays);
  }

  while (cycleStart <= input.rangeEnd) {
    for (let offset = 0; offset < input.periodLengthDays; offset += 1) {
      const day = addDays(cycleStart, offset);
      if (day >= input.rangeStart && day <= input.rangeEnd) {
        days.add(day);
      }
    }
    cycleStart = addDays(cycleStart, input.cycleLengthDays);
  }

  return days;
}

export function monthGrid(year: number, month: number) {
  const first = new Date(year, month, 1);
  const startOffset = (first.getDay() + 6) % 7;
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const cells: Array<{ key: string; day: number | null }> = [];

  for (let i = 0; i < startOffset; i += 1) {
    cells.push({ key: `empty-${i}`, day: null });
  }

  for (let day = 1; day <= daysInMonth; day += 1) {
    const key = `${year}-${String(month + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
    cells.push({ key, day });
  }

  return cells;
}
