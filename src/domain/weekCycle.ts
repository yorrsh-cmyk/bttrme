// Pure week-cycle logic (src/domain rule: no I/O, no framework).
// Weeks start Sunday by default (Gate 4). All "which week / which day" questions
// are answered as CIVIL DATES in the user's timezone, so DST never shifts a
// boundary: we read the wall-clock date via Intl, then do the ± day arithmetic
// in UTC where a "day" is always exactly 24h.

export type WeekStartDay = "sun" | "mon";

/** An ISO calendar date, `YYYY-MM-DD`, with no time or zone attached. */
export type CivilDate = string;

const START_INDEX: Record<WeekStartDay, number> = { sun: 0, mon: 1 };

// 0 = Sunday … 6 = Saturday, matching JS getUTCDay / the "en-US" weekday order.
const WEEKDAY_INDEX: Record<string, number> = {
  Sun: 0,
  Mon: 1,
  Tue: 2,
  Wed: 3,
  Thu: 4,
  Fri: 5,
  Sat: 6,
};

interface CivilParts {
  year: number;
  month: number; // 1–12
  day: number; // 1–31
  weekday: number; // 0 = Sunday
}

/** The wall-clock date (and weekday) for an instant, in a given IANA timezone. */
export function civilPartsInTimeZone(instant: Date, timeZone: string): CivilParts {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    weekday: "short",
  }).formatToParts(instant);

  const get = (type: string) => parts.find((p) => p.type === type)?.value ?? "";
  return {
    year: Number(get("year")),
    month: Number(get("month")),
    day: Number(get("day")),
    weekday: WEEKDAY_INDEX[get("weekday")] ?? 0,
  };
}

function toCivilDate({ year, month, day }: Pick<CivilParts, "year" | "month" | "day">): CivilDate {
  const mm = String(month).padStart(2, "0");
  const dd = String(day).padStart(2, "0");
  return `${year}-${mm}-${dd}`;
}

/** Add (or subtract) whole calendar days to a civil date. DST-safe (UTC math). */
export function addDays(date: CivilDate, days: number): CivilDate {
  const [y, m, d] = date.split("-").map(Number) as [number, number, number];
  const utc = new Date(Date.UTC(y, m - 1, d));
  utc.setUTCDate(utc.getUTCDate() + days);
  return toCivilDate({
    year: utc.getUTCFullYear(),
    month: utc.getUTCMonth() + 1,
    day: utc.getUTCDate(),
  });
}

/** The civil weekday (0 = Sunday) of a civil date. */
export function weekdayOf(date: CivilDate): number {
  const [y, m, d] = date.split("-").map(Number) as [number, number, number];
  return new Date(Date.UTC(y, m - 1, d)).getUTCDay();
}

/** The week-start civil date (a Sunday by default) for a given civil date. */
export function weekStartForDate(date: CivilDate, weekStartDay: WeekStartDay = "sun"): CivilDate {
  const daysBack = (weekdayOf(date) - START_INDEX[weekStartDay] + 7) % 7;
  return addDays(date, -daysBack);
}

/** The week-start civil date for the week that contains `now`, in the user's tz. */
export function weekStartForInstant(
  now: Date,
  timeZone: string,
  weekStartDay: WeekStartDay = "sun",
): CivilDate {
  const civil = civilPartsInTimeZone(now, timeZone);
  const daysBack = (civil.weekday - START_INDEX[weekStartDay] + 7) % 7;
  return addDays(toCivilDate(civil), -daysBack);
}

/** Today's civil date in the user's timezone. */
export function todayInTimeZone(now: Date, timeZone: string): CivilDate {
  return toCivilDate(civilPartsInTimeZone(now, timeZone));
}

export function nextWeekStart(weekStart: CivilDate): CivilDate {
  return addDays(weekStart, 7);
}

export function previousWeekStart(weekStart: CivilDate): CivilDate {
  return addDays(weekStart, -7);
}

/** Inclusive last day of the week (start + 6). */
export function weekEnd(weekStart: CivilDate): CivilDate {
  return addDays(weekStart, 6);
}

// Planning the *next* week is allowed from two days before it starts — i.e.
// the Friday before a Sunday week (PRD 02 §9; IA Part E "planning ahead from
// Friday"). Before that horizon, next week is not yet offered.
export const PLANNING_LOOKAHEAD_DAYS = 2;

/** Is `weekStart` a week the user may view/plan as of `now`? */
export function isWeekPlannable(
  weekStart: CivilDate,
  now: Date,
  timeZone: string,
  weekStartDay: WeekStartDay = "sun",
): boolean {
  const currentStart = weekStartForInstant(now, timeZone, weekStartDay);
  // The current week and any past week are always viewable.
  if (weekStart <= currentStart) return true;
  // A future week: only the immediate next one, and only within the lookahead.
  if (weekStart !== nextWeekStart(currentStart)) return false;
  const today = todayInTimeZone(now, timeZone);
  return today >= addDays(weekStart, -PLANNING_LOOKAHEAD_DAYS);
}
