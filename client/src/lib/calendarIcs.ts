import { sourceEasternTimestamp } from "./calendarRisk";

export type CalendarExportEvent = {
  id: string;
  date: string;
  time: string;
  country: string;
  event: string;
  impact: string;
  forecast?: string;
  previous?: string;
};

function escapeIcs(value: string) {
  return value.replace(/\\/g, "\\\\").replace(/;/g, "\\;").replace(/,/g, "\\,").replace(/\r?\n/g, "\\n");
}

function formatUtcTimestamp(timestamp: number) {
  const date = new Date(timestamp);
  const pad = (value: number) => String(value).padStart(2, "0");
  return `${date.getUTCFullYear()}${pad(date.getUTCMonth() + 1)}${pad(date.getUTCDate())}T${pad(date.getUTCHours())}${pad(date.getUTCMinutes())}${pad(date.getUTCSeconds())}Z`;
}

function formatDateOnly(date: string) {
  return date.replace(/-/g, "");
}

function nextDate(date: string) {
  const value = new Date(`${date}T12:00:00Z`);
  value.setUTCDate(value.getUTCDate() + 1);
  return value.toISOString().slice(0, 10).replace(/-/g, "");
}

function eventDescription(event: CalendarExportEvent) {
  const details = [
    `${event.country} high-impact economic event`,
    `Source time: ${event.date} ${event.time} New York`,
    event.forecast ? `Forecast: ${event.forecast}` : "",
    event.previous ? `Previous: ${event.previous}` : "",
    "Source: Trade Fusion Economic Calendar",
  ].filter(Boolean);
  return details.join("\n");
}

export function buildEconomicEventIcs(event: CalendarExportEvent, now = new Date()) {
  const timestamp = sourceEasternTimestamp(event.date, event.time);
  const uid = `${event.id}-${event.date}@tradefusion.app`;
  const dtstamp = formatUtcTimestamp(now.getTime());
  const lines = [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//Trade Fusion//Economic Calendar//EN",
    "CALSCALE:GREGORIAN",
    "METHOD:PUBLISH",
    "BEGIN:VEVENT",
    `UID:${escapeIcs(uid)}`,
    `DTSTAMP:${dtstamp}`,
    `SUMMARY:${escapeIcs(`${event.country} · ${event.event}`)}`,
    `DESCRIPTION:${escapeIcs(eventDescription(event))}`,
    `CATEGORIES:${escapeIcs(event.impact.toUpperCase())},ECONOMIC NEWS`,
  ];

  if (timestamp === null) {
    lines.push(`DTSTART;VALUE=DATE:${formatDateOnly(event.date)}`);
    lines.push(`DTEND;VALUE=DATE:${nextDate(event.date)}`);
  } else {
    const start = formatUtcTimestamp(timestamp);
    lines.push(`DTSTART:${start}`);
    lines.push(`DTEND:${formatUtcTimestamp(timestamp + 30 * 60_000)}`);
    lines.push("BEGIN:VALARM", "ACTION:DISPLAY", "DESCRIPTION:Trade Fusion high-impact news reminder", "TRIGGER:-PT1H", "END:VALARM");
    lines.push("BEGIN:VALARM", "ACTION:DISPLAY", "DESCRIPTION:Trade Fusion high-impact news reminder", "TRIGGER:-PT15M", "END:VALARM");
  }

  lines.push("END:VEVENT", "END:VCALENDAR", "");
  return lines.join("\r\n");
}

export function buildEconomicWeekIcs(events: CalendarExportEvent[], now = new Date()) {
  const eventBlocks = events.map(event => buildEconomicEventIcs(event, now).split("\r\n").slice(5, -2).join("\r\n"));
  return [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//Trade Fusion//Economic Calendar//EN",
    "CALSCALE:GREGORIAN",
    "METHOD:PUBLISH",
    ...eventBlocks,
    "END:VCALENDAR",
    "",
  ].join("\r\n");
}

export function downloadIcs(filename: string, content: string) {
  const blob = new Blob([content], { type: "text/calendar;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = filename;
  anchor.click();
  window.setTimeout(() => URL.revokeObjectURL(url), 0);
}
