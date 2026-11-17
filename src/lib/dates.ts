import type { ClockTime, ISODate } from "./types";

/** The bands are in Phoenix; Arizona has no daylight saving, so this never drifts. */
export const TIME_ZONE = "America/Phoenix";

export const ISO_DATE = /^\d{4}-\d{2}-\d{2}$/;
export const ISO_MONTH = /^\d{4}-\d{2}$/;
export const CLOCK = /^\d{2}:\d{2}$/;

/** Today in the bands' timezone. Call only at request time. */
export function todayISO(now = new Date()): ISODate {
  return new Intl.DateTimeFormat("en-CA", { timeZone: TIME_ZONE }).format(now);
}

const utc = (date: ISODate) => new Date(`${date}T00:00:00Z`);

export function addDays(date: ISODate, n: number): ISODate {
  const d = utc(date);
  d.setUTCDate(d.getUTCDate() + n);
  return d.toISOString().slice(0, 10);
}

/** `2026-12` → `2027-01` for n = 1. */
export function addMonths(month: string, n: number): string {
  const [y, m] = month.split("-").map(Number);
  const d = new Date(Date.UTC(y, m - 1 + n, 1));
  return d.toISOString().slice(0, 7);
}

export function monthBounds(month: string): { start: ISODate; end: ISODate } {
  const start = `${month}-01`;
  return { start, end: addDays(`${addMonths(month, 1)}-01`, -1) };
}

/** Weeks for a Sunday-first month grid; days outside the month are null. */
export function monthGrid(month: string): (ISODate | null)[][] {
  const { start, end } = monthBounds(month);
  const lead = utc(start).getUTCDay();
  const cells: (ISODate | null)[] = Array(lead).fill(null);
  for (let d = start; d <= end; d = addDays(d, 1)) cells.push(d);
  while (cells.length % 7) cells.push(null);
  const weeks: (ISODate | null)[][] = [];
  for (let i = 0; i < cells.length; i += 7) weeks.push(cells.slice(i, i + 7));
  return weeks;
}

const fmt = (opts: Intl.DateTimeFormatOptions) =>
  new Intl.DateTimeFormat("en-US", { timeZone: "UTC", ...opts });

const MONTH = fmt({ month: "long", year: "numeric" });
const LONG = fmt({ weekday: "long", month: "long", day: "numeric", year: "numeric" });
const SHORT = fmt({ weekday: "short", month: "short", day: "numeric" });

export const monthLabel = (month: string) => MONTH.format(utc(`${month}-01`));
export const longDate = (date: ISODate) => LONG.format(utc(date));
export const shortDate = (date: ISODate) => SHORT.format(utc(date));
export const dayOfMonth = (date: ISODate) => utc(date).getUTCDate();

/** `20:00` → `8:00 PM`. */
export function clockLabel(t: ClockTime): string {
  const [h, m] = t.split(":").map(Number);
  const hour = h % 12 || 12;
  return `${hour}:${String(m).padStart(2, "0")} ${h < 12 ? "AM" : "PM"}`;
}

export function timeRange(start?: ClockTime, end?: ClockTime): string | undefined {
  if (!start) return undefined;
  return end ? `${clockLabel(start)} – ${clockLabel(end)}` : clockLabel(start);
}

/** Every date from `start` to `end`, inclusive. */
export function eachDayOf(start: ISODate, end: ISODate): ISODate[] {
  const days: ISODate[] = [];
  for (let d = start; d <= end; d = addDays(d, 1)) days.push(d);
  return days;
}
