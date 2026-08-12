import { publicProcedure, router } from "./_core/trpc";

const FOREX_FACTORY_FEED_URL =
  "https://nfs.faireconomy.media/ff_calendar_thisweek.xml";
// ForexFactory updates this weekly export at most hourly and throttles frequent reads.
const CACHE_TTL_MS = 60 * 60 * 1000;

// The ForexFactory XML feed publishes its schedule in UTC. The client converts
// date/time pairs to America/New_York before presenting them to journal users.

export type CalendarImpact = "high" | "medium" | "low" | "holiday" | "unknown";

export interface EconomicEvent {
  id: string;
  date: string;
  time: string;
  country: string;
  event: string;
  impact: CalendarImpact;
  forecast?: string;
  previous?: string;
  actual?: string;
  sourceUrl?: string;
}

export interface CalendarResponse {
  events: EconomicEvent[];
  sourceStatus: "live" | "stale" | "unavailable";
  refreshedAt: string;
  message?: string;
}

let cachedCalendar: CalendarResponse | null = null;
let cachedAt = 0;

function decodeXml(value: string): string {
  return value
    .replace(/^<!\[CDATA\[([\s\S]*?)\]\]>$/i, "$1")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .trim();
}

function readTag(eventXml: string, tag: string): string | undefined {
  const pairedTag = new RegExp(
    `<${tag}(?:\\s[^>]*)?>([\\s\\S]*?)<\\/${tag}>`,
    "i"
  );
  const value = eventXml.match(pairedTag)?.[1];
  if (!value) return undefined;

  const cleaned = decodeXml(value);
  return cleaned.length > 0 ? cleaned : undefined;
}

export function toIsoDate(rawDate: string | undefined): string | undefined {
  if (!rawDate) return undefined;

  const match = rawDate.trim().match(/^(\d{2})-(\d{2})-(\d{4})$/);
  if (!match) return undefined;

  const [, month, day, year] = match;
  return `${year}-${month}-${day}`;
}

function toImpact(rawImpact: string | undefined): CalendarImpact {
  switch (rawImpact?.trim().toLowerCase()) {
    case "high":
      return "high";
    case "medium":
      return "medium";
    case "low":
      return "low";
    case "holiday":
      return "holiday";
    default:
      return "unknown";
  }
}

/** Parse the weekly, structured ForexFactory calendar feed without inventing values. */
export function parseForexFactoryFeed(xml: string): EconomicEvent[] {
  const events: EconomicEvent[] = [];
  const eventBlocks = xml.match(/<event>([\s\S]*?)<\/event>/gi) ?? [];

  eventBlocks.forEach((block, index) => {
    const date = toIsoDate(readTag(block, "date"));
    const time = readTag(block, "time");
    const country = readTag(block, "country");
    const event = readTag(block, "title");

    // Reject incomplete records rather than showing incorrect or guessed values.
    if (!date || !time || !country || !event) return;

    events.push({
      id: `${date}-${country}-${index}`,
      date,
      time,
      country,
      event,
      impact: toImpact(readTag(block, "impact")),
      forecast: readTag(block, "forecast"),
      previous: readTag(block, "previous"),
      actual: readTag(block, "actual"),
      sourceUrl: readTag(block, "url"),
    });
  });

  return events;
}

export function calendarFallback(cached: CalendarResponse | null, message: string): CalendarResponse {
  if (cached?.events.length) {
    return {
      ...cached,
      sourceStatus: "stale",
      message: "Showing the last verified weekly calendar while ForexFactory updates or rate-limits its export.",
    };
  }
  return {
    events: [],
    sourceStatus: "unavailable",
    refreshedAt: new Date().toISOString(),
    message,
  };
}

export async function getLiveCalendarEvents(): Promise<CalendarResponse> {
  const now = Date.now();
  if (cachedCalendar && now - cachedAt < CACHE_TTL_MS) {
    return cachedCalendar;
  }

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 12_000);

  try {
    const response = await fetch(FOREX_FACTORY_FEED_URL, {
      headers: {
        Accept: "application/xml,text/xml;q=0.9,*/*;q=0.8",
        "User-Agent":
          "Mozilla/5.0 (compatible; TradeFusionJournal/1.0; economic-calendar)",
      },
      signal: controller.signal,
    });

    if (!response.ok) {
      throw new Error(`ForexFactory feed returned HTTP ${response.status}`);
    }

    const events = parseForexFactoryFeed(await response.text());
    if (events.length === 0) {
      throw new Error("ForexFactory feed contained no valid calendar events");
    }

    cachedCalendar = {
      events,
      sourceStatus: "live",
      refreshedAt: new Date().toISOString(),
    };
    cachedAt = now;
    return cachedCalendar;
  } catch (error) {
    const message =
      error instanceof Error
        ? error.message
        : "Unable to retrieve the ForexFactory calendar.";

    console.error("[Calendar] ForexFactory retrieval failed:", message);
    return calendarFallback(
      cachedCalendar,
      "Live ForexFactory data is temporarily unavailable. Please try again after the source updates."
    );
  } finally {
    clearTimeout(timeout);
  }
}

export const calendarRouter = router({
  getEvents: publicProcedure.query(getLiveCalendarEvents),
});
