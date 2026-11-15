// Date helpers. The backend stores naive local wall-clock times
// ("2026-11-20" + "09:00:00") and the planner works in the browser's local
// time, so everything here uses the browser's time zone too.

import type { ISODate } from "../types/backend";

// Monday = 0 ... Sunday = 6, the convention the backend uses for weekdays.
export const WEEKDAYS = [
  { value: 0, short: "Mon", long: "Monday" },
  { value: 1, short: "Tue", long: "Tuesday" },
  { value: 2, short: "Wed", long: "Wednesday" },
  { value: 3, short: "Thu", long: "Thursday" },
  { value: 4, short: "Fri", long: "Friday" },
  { value: 5, short: "Sat", long: "Saturday" },
  { value: 6, short: "Sun", long: "Sunday" },
] as const;

const pad = (n: number) => String(n).padStart(2, "0");

// Date -> "YYYY-MM-DD" in local time.
export function toISODate(date: Date): ISODate {
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
}

export function todayISO(): ISODate {
  return toISODate(new Date());
}

// "YYYY-MM-DD" -> local midnight. (new Date("YYYY-MM-DD") would be UTC.)
export function parseISODate(value: ISODate): Date {
  const [y, m, d] = value.split("-").map(Number);
  return new Date(y, m - 1, d);
}

export function addDays(value: ISODate, days: number): ISODate {
  const date = parseISODate(value);
  date.setDate(date.getDate() + days);
  return toISODate(date);
}

// Backend weekday (Mon = 0) of a date.
export function weekdayOf(value: ISODate): number {
  return (parseISODate(value).getDay() + 6) % 7;
}

// Monday of the week that contains `value`.
export function startOfWeek(value: ISODate): ISODate {
  return addDays(value, -weekdayOf(value));
}

export function daysBetween(from: ISODate, to: ISODate): number {
  const ms = parseISODate(to).getTime() - parseISODate(from).getTime();
  return Math.round(ms / 86_400_000);
}

// "0,2,4" -> [0, 2, 4]. Ignores anything that is not 0-6.
export function parseWeekdays(text: string | null | undefined): number[] {
  const days = new Set<number>();
  for (const part of (text ?? "").split(",")) {
    const n = Number(part.trim());
    if (part.trim() !== "" && Number.isInteger(n) && n >= 0 && n <= 6) days.add(n);
  }
  return [...days].sort((a, b) => a - b);
}

export function formatWeekdays(days: number[]): string {
  return [...days].sort((a, b) => a - b).join(",");
}

// "09:00:00" -> "09:00" for <input type="time">.
export function toTimeInput(value: string | null | undefined): string {
  return value ? value.slice(0, 5) : "";
}

// "09:00" -> "09:00:00" for the API. Empty -> null.
export function fromTimeInput(value: string): string | null {
  if (!value) return null;
  return value.length === 5 ? `${value}:00` : value;
}

// "HH:MM[:SS]" -> minutes after midnight.
export function timeToMinutes(value: string): number {
  const [h, m] = value.split(":").map(Number);
  return h * 60 + (m || 0);
}

const timeFormatter = new Intl.DateTimeFormat(undefined, {
  hour: "numeric",
  minute: "2-digit",
});

// "13:30:00" -> "1:30 PM" (in the user's locale).
export function formatTime(value: string | null | undefined): string {
  if (!value) return "";
  const [h, m] = value.split(":").map(Number);
  return timeFormatter.format(new Date(2000, 0, 1, h, m || 0));
}

const dateFormatter = new Intl.DateTimeFormat(undefined, {
  weekday: "short",
  month: "short",
  day: "numeric",
});

const longDateFormatter = new Intl.DateTimeFormat(undefined, {
  weekday: "long",
  month: "long",
  day: "numeric",
  year: "numeric",
});

export function formatDate(value: ISODate | null | undefined): string {
  return value ? dateFormatter.format(parseISODate(value)) : "";
}

export function formatLongDate(value: ISODate): string {
  return longDateFormatter.format(parseISODate(value));
}

// "in 3 days", "today", "2 days ago" relative to today.
export function relativeDays(value: ISODate): string {
  const diff = daysBetween(todayISO(), value);
  if (diff === 0) return "today";
  if (diff === 1) return "tomorrow";
  if (diff === -1) return "yesterday";
  return diff > 0 ? `in ${diff} days` : `${-diff} days ago`;
}

// Local "YYYY-MM-DDTHH:MM:SS" without an offset. Date.parse and
// FullCalendar (timeZone "local") both read it as local time.
export function localDateTime(date: ISODate, time: string): string {
  const t = time.length === 5 ? `${time}:00` : time;
  return `${date}T${t}`;
}
