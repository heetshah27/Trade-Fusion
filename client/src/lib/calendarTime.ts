const SOURCE_TIME_ZONE = "UTC";
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
 * The ForexFactory XML feed supplies clock times in UTC. Convert those source
 * timestamps to America/New_York so calendar users see U.S. Eastern Time with
 * daylight-saving adjustments applied by the runtime.
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
  const sourceTimestamp = new Date(
    Date.UTC(year, month - 1, day, parsedTime.hour, parsedTime.minute)
  );

  const dateLabel = new Intl.DateTimeFormat("en-US", {
    timeZone: CALENDAR_DISPLAY_TIME_ZONE,
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(sourceTimestamp);

  const timeLabel = new Intl.DateTimeFormat("en-US", {
    timeZone: CALENDAR_DISPLAY_TIME_ZONE,
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  }).format(sourceTimestamp);

  return { dateLabel, timeLabel };
}
