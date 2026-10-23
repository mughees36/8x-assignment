import { clsx, type ClassValue } from "clsx";
import { format, isValid, parseISO } from "date-fns";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatDuration(seconds: number) {
  const minutes = Math.floor(seconds / 60);
  return `${minutes}m`;
}

export function formatTimestamp(seconds: number) {
  const minutes = Math.floor(seconds / 60);
  return `${minutes}:${String(seconds % 60).padStart(2, "0")}`;
}

export function formatDueDate(value: string) {
  const parsed = parseISO(value);
  return isValid(parsed) ? format(parsed, "MMM d, yyyy") : value;
}

// Use one time zone on the server and browser so recorded meeting dates hydrate
// consistently. The UTC suffix makes the displayed time unambiguous.
export function formatMeetingDate(value: string, long = false) {
  const date = new Date(value);
  if (!Number.isFinite(date.getTime())) return value;
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone: "UTC", weekday: long ? "long" : undefined,
    month: long ? "long" : "short", day: "numeric", year: long ? undefined : "numeric",
    hour: "numeric", minute: "2-digit", hour12: true,
  }).formatToParts(date);
  const part = (type: Intl.DateTimeFormatPartTypes) => parts.find((item) => item.type === type)?.value ?? "";
  const day = `${part("month")} ${part("day")}`;
  const time = `${part("hour")}:${part("minute")} ${part("dayPeriod")} UTC`;
  return long ? `${part("weekday")}, ${day} · ${time}` : `${day}, ${part("year")} · ${time}`;
}
