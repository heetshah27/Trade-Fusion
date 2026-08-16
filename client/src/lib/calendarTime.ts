export const CALENDAR_DISPLAY_TIME_ZONE = "America/New_York";

export type CalendarTimeDisplay = {
  dateLabel: string;
  timeLabel: string;
};

function parseSourceTime(time: string): { hour: number; minute: number } | null {
  const parsed = time.trim().match(/^(\d{1,2})(?::(\d{2}))?\s*(am|pm)?$/i);
  if (!parsed) return null;

  const minute = Number(parsed[2] ?? "0");
  const meridiem = parsed[3]?.toLowerCase();
  let hour = Number(parsed[1]);
  if (hour > 23 || minute > 59) return null;
  if (meridiem === "am" && hour === 12) hour = 0;
  if (meridiem === "pm" && hour < 12) hour += 12;
  return { hour, minute };
}

/**
 * ForexFactory's structured JSON export already uses an America/New_York
 * timestamp. The server returns that published ET date and clock time, so this
 * function formats it without a second timezone conversion.
 */
export function toEasternCalendarDisplay(
  sourceDate: string,
  sourceTime: string
): CalendarTimeDisplay {
  const dateParts = sourceDate.split("-").map(Number);
  const parsedTime = parseSourceTime(sourceTime);
  if (dateParts.length !== 3 || dateParts.some(Number.isNaN) || !parsedTime) {
    return { dateLabel: sourceDate, timeLabel: sourceTime };
  }

  const [year, month, day] = dateParts;
  const dateTimestamp = new Date(Date.UTC(year, month - 1, day, 12, 0));
  const clockTimestamp = new Date(Date.UTC(2000, 0, 1, parsedTime.hour, parsedTime.minute));
  const dateLabel = new Intl.DateTimeFormat("en-US", {
    timeZone: "UTC",
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(dateTimestamp);
  const timeLabel = new Intl.DateTimeFormat("en-US", {
    timeZone: "UTC",
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  }).format(clockTimestamp);
  return { dateLabel, timeLabel };
}
