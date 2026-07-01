const pad2 = (n: number) => String(n).padStart(2, "0");

export function dateKeyLocal(d: Date): string {
  return `${d.getFullYear()}-${pad2(d.getMonth() + 1)}-${pad2(d.getDate())}`;
}

export function startOfMonth(d: Date): Date {
  return new Date(d.getFullYear(), d.getMonth(), 1);
}

export function endOfMonth(d: Date): Date {
  return new Date(d.getFullYear(), d.getMonth() + 1, 0);
}

export function addMonths(d: Date, delta: number): Date {
  return new Date(d.getFullYear(), d.getMonth() + delta, 1);
}

export function isSameDay(a: Date, b: Date): boolean {
  return a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();
}

export function isSameMonth(a: Date, b: Date): boolean {
  return a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth();
}

export function weekDayIndexMondayFirst(d: Date): number {
  // JS: 0=Sun..6=Sat -> convert to 0=Mon..6=Sun
  return (d.getDay() + 6) % 7;
}

export function monthTitleRu(d: Date): string {
  return new Intl.DateTimeFormat("ru-RU", { month: "long", year: "numeric" }).format(d);
}

/** Max week rows in a Gregorian month grid (studio uses this for a stable height). */
export const CALENDAR_DISPLAY_WEEK_ROWS = 6;

export type BuildMonthGridOptions = {
  /** When set, pad with trailing days to exactly this many rows (e.g. 6 → 42 cells). */
  weekRows?: number;
};

export function buildMonthGrid(month: Date, options?: BuildMonthGridOptions): Date[] {
  const start = startOfMonth(month);
  const end = endOfMonth(month);

  const leading = weekDayIndexMondayFirst(start); // 0..6
  const daysInMonth = end.getDate();

  const grid: Date[] = [];

  // leading days from previous month
  for (let i = 0; i < leading; i++) {
    grid.push(new Date(start.getFullYear(), start.getMonth(), 1 - (leading - i)));
  }

  // current month
  for (let day = 1; day <= daysInMonth; day++) {
    grid.push(new Date(start.getFullYear(), start.getMonth(), day));
  }

  const naturalWeeks = Math.ceil(grid.length / 7);
  const targetWeeks = options?.weekRows ?? naturalWeeks;
  const targetLen = Math.max(naturalWeeks, targetWeeks) * 7;

  while (grid.length < targetLen) {
    const last = grid[grid.length - 1]!;
    grid.push(new Date(last.getFullYear(), last.getMonth(), last.getDate() + 1));
  }

  return grid;
}

export function dateTimeFromDateKey(dateKey: string, time: string): Date | null {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(dateKey)) return null;
  if (!/^\d{2}:\d{2}$/.test(time)) return null;
  const [y, m, d] = dateKey.split("-").map((x) => Number(x));
  const [hh, mm] = time.split(":").map((x) => Number(x));
  if (![y, m, d, hh, mm].every(Number.isFinite)) return null;
  return new Date(y, m - 1, d, hh, mm, 0, 0);
}

export function isExpiredEvent(dateKey: string, time: string, nowMs: number): boolean {
  const dt = dateTimeFromDateKey(dateKey, time);
  if (!dt) return false;
  return dt.getTime() < nowMs;
}

/** Earliest year in calendar month/year pickers (product launch window). */
export const CALENDAR_MIN_YEAR = 2026;

const CALENDAR_YEAR_FUTURE_SPAN = 6;

export function buildCalendarYearOptions(now = new Date()): Array<{ value: number; label: string }> {
  const y = now.getFullYear();
  const start = CALENDAR_MIN_YEAR;
  const end = Math.max(y + CALENDAR_YEAR_FUTURE_SPAN, start);
  const out: Array<{ value: number; label: string }> = [];
  for (let i = start; i <= end; i++) out.push({ value: i, label: String(i) });
  return out;
}
