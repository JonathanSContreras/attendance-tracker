/**
 * Sessions are keyed by calendar day. Dates arrive from the client as
 * "YYYY-MM-DD" strings and are stored as local midnight so the same day
 * always maps to the same row, regardless of the time a request is made.
 */
export function parseDateOnly(dateStr: string): Date {
  const [year, month, day] = dateStr.split("-").map(Number);
  return new Date(year, month - 1, day);
}

/** Truncate a Date to local midnight. */
export function startOfDay(d: Date): Date {
  return new Date(d.getFullYear(), d.getMonth(), d.getDate());
}

/** Format a Date as "YYYY-MM-DD" in local time. */
export function toDateKey(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

/** Today's date as "YYYY-MM-DD" in the user's local timezone. */
export function todayKey(): string {
  return toDateKey(new Date());
}

export function isDateKey(value: unknown): value is string {
  return typeof value === "string" && /^\d{4}-\d{2}-\d{2}$/.test(value);
}
