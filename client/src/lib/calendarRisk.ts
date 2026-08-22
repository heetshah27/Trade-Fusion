import { CALENDAR_DISPLAY_TIME_ZONE } from "./calendarTime";

export type CalendarRiskEvent = {
  id: string;
  date: string;
  time: string;
  country: string;
  event: string;
  impact: string;
};

function parseSourceTime(time: string) {
  const match = time.trim().match(/^(\d{1,2})(?::(\d{2}))?\s*(am|pm)$/i);
  if (!match) return null;
  let hour = Number(match[1]);
  const minute = Number(match[2] ?? "0");
  const meridiem = match[3].toLowerCase();
  if (hour > 12 || minute > 59) return null;
  if (meridiem === "am" && hour === 12) hour = 0;
  if (meridiem === "pm" && hour < 12) hour += 12;
  return { hour, minute };
}

function easternOffsetMinutes(timestamp: number) {
  const part = new Intl.DateTimeFormat("en-US", {
    timeZone: CALENDAR_DISPLAY_TIME_ZONE,
    timeZoneName: "shortOffset",
  }).formatToParts(new Date(timestamp)).find(part => part.type === "timeZoneName")?.value;
  const match = part?.match(/^GMT([+-])(\d{1,2})(?::(\d{2}))?$/);
  if (!match) return -300;
  const total = Number(match[2]) * 60 + Number(match[3] ?? "0");
  return match[1] === "+" ? total : -total;
}

/** Converts the source-published New York date and time into a UTC timestamp for countdown use. */
export function sourceEasternTimestamp(date: string, time: string) {
  const dateParts = date.split("-").map(Number);
  const parsedTime = parseSourceTime(time);
  if (dateParts.length !== 3 || dateParts.some(Number.isNaN) || !parsedTime) return null;
  const [year, month, day] = dateParts;
  const nominalUtc = Date.UTC(year, month - 1, day, parsedTime.hour, parsedTime.minute);
  return nominalUtc - easternOffsetMinutes(nominalUtc) * 60_000;
}

export function easternTodayIso(now = new Date()) {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone: CALENDAR_DISPLAY_TIME_ZONE,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(now);
  const year = parts.find(part => part.type === "year")?.value;
  const month = parts.find(part => part.type === "month")?.value;
  const day = parts.find(part => part.type === "day")?.value;
  return year && month && day ? `${year}-${month}-${day}` : "";
}

export function nextHighImpactToday(events: CalendarRiskEvent[], now = new Date()) {
  const today = easternTodayIso(now);
  return events
    .filter(event => event.impact === "high" && event.date === today)
    .map(event => ({ event, timestamp: sourceEasternTimestamp(event.date, event.time) }))
    .filter((item): item is { event: CalendarRiskEvent; timestamp: number } => item.timestamp !== null && item.timestamp > now.getTime())
    .sort((a, b) => a.timestamp - b.timestamp)[0] ?? null;
}

export function formatRiskCountdown(timestamp: number, now = new Date()) {
  const remaining = Math.max(0, timestamp - now.getTime());
  if (remaining < 60_000) return "Less than 1m";
  const minutes = Math.floor(remaining / 60_000);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);
  if (days) return `${days}d ${hours % 24}h`;
  if (hours) return `${hours}h ${minutes % 60}m`;
  return `${minutes}m`;
}
