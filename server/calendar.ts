import { publicProcedure, router } from "./_core/trpc";
import { eq } from "drizzle-orm";
import { calendarCache } from "../drizzle/schema";
import { getDb } from "./db";

const FOREX_FACTORY_FEED_URL =
  "https://nfs.faireconomy.media/ff_calendar_thisweek.json";
// ForexFactory updates this export at most hourly and can rate-limit repeated reads; a durable cache keeps cold instances responsive.
const CACHE_TTL_MS = 60 * 60 * 1000;
const STALE_RETRY_TTL_MS = 15 * 60 * 1000;
const CALENDAR_CACHE_KEY = "forexfactory_thisweek";

// The structured JSON export includes a New York offset in each timestamp.
// Preserve that source time rather than applying a second offset in the client.

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
  coverageStart?: string;
  coverageEnd?: string;
}

type ForexFactoryJsonRecord = {
  title?: unknown;
  country?: unknown;
  date?: unknown;
  impact?: unknown;
  forecast?: unknown;
  previous?: unknown;
  actual?: unknown;
};

let cachedCalendar: CalendarResponse | null = null;
let cachedAt = 0;
let inFlightCalendarRequest: Promise<CalendarResponse> | null = null;
let bypassDurableCacheForTest = false;

export function resetCalendarCacheForTest() {
  cachedCalendar = null;
  cachedAt = 0;
  inFlightCalendarRequest = null;
  bypassDurableCacheForTest = true;
}

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

function asOptionalText(value: unknown): string | undefined {
  if (typeof value !== "string" && typeof value !== "number") return undefined;
  const text = String(value).trim();
  return text.length > 0 ? text : undefined;
}

function eastParts(date: Date) {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "America/New_York",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(date);
}

function easternDateAndTime(timestamp: string): { date: string; time: string } | undefined {
  const parsed = new Date(timestamp);
  if (Number.isNaN(parsed.getTime())) return undefined;

  const dateParts = eastParts(parsed);
  const year = dateParts.find(part => part.type === "year")?.value;
  const month = dateParts.find(part => part.type === "month")?.value;
  const day = dateParts.find(part => part.type === "day")?.value;
  if (!year || !month || !day) return undefined;

  const time = new Intl.DateTimeFormat("en-US", {
    timeZone: "America/New_York",
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  })
    .format(parsed)
    .replace(/\s/g, "")
    .toLowerCase();

  return { date: `${year}-${month}-${day}`, time };
}

/** Legacy XML parser retained for historical parser tests and source diagnostics. */
export function parseForexFactoryFeed(xml: string): EconomicEvent[] {
  const events: EconomicEvent[] = [];
  const eventBlocks = xml.match(/<event>([\s\S]*?)<\/event>/gi) ?? [];

  eventBlocks.forEach((block, index) => {
    const date = toIsoDate(readTag(block, "date"));
    const time = readTag(block, "time");
    const country = readTag(block, "country");
    const event = readTag(block, "title");
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

/** Parse source-published structured timestamps with their explicit New York offset. */
export function parseForexFactoryJson(payload: string): EconomicEvent[] {
  let records: unknown;
  try {
    records = JSON.parse(payload);
  } catch {
    return [];
  }
  if (!Array.isArray(records)) return [];

  const events: EconomicEvent[] = [];
  records.forEach((record, index) => {
    if (!record || typeof record !== "object") return;
    const item = record as ForexFactoryJsonRecord;
    const event = asOptionalText(item.title);
    const country = asOptionalText(item.country);
    const timestamp = asOptionalText(item.date);
    const eastern = timestamp ? easternDateAndTime(timestamp) : undefined;
    if (!event || !country || !timestamp || !eastern) return;

    events.push({
      id: `${timestamp}-${country}-${index}`,
      date: eastern.date,
      time: eastern.time,
      country,
      event,
      impact: toImpact(asOptionalText(item.impact)),
      forecast: asOptionalText(item.forecast),
      previous: asOptionalText(item.previous),
      actual: asOptionalText(item.actual),
    });
  });

  return events;
}

export function getCalendarCoverage(events: EconomicEvent[]) {
  const dates = events.map(event => event.date).sort();
  return { coverageStart: dates[0], coverageEnd: dates.at(-1) };
}

export function getEasternTodayIso(now = new Date()): string {
  const parts = eastParts(now);
  const year = parts.find(part => part.type === "year")?.value;
  const month = parts.find(part => part.type === "month")?.value;
  const day = parts.find(part => part.type === "day")?.value;
  return year && month && day ? `${year}-${month}-${day}` : now.toISOString().slice(0, 10);
}

export function hasCurrentCalendarCoverage(events: EconomicEvent[], now = new Date()): boolean {
  const { coverageEnd } = getCalendarCoverage(events);
  return Boolean(coverageEnd && coverageEnd >= getEasternTodayIso(now));
}

export function calendarFallback(cached: CalendarResponse | null, message: string): CalendarResponse {
  if (cached?.events.length) {
    return {
      ...cached,
      sourceStatus: "stale",
      message: "Showing the last verified calendar coverage while ForexFactory updates or rate-limits its export.",
    };
  }
  return {
    events: [],
    sourceStatus: "unavailable",
    refreshedAt: new Date().toISOString(),
    message,
  };
}

function isCalendarResponse(value: unknown): value is CalendarResponse {
  if (!value || typeof value !== "object") return false;
  const response = value as Partial<CalendarResponse>;
  return Array.isArray(response.events)
    && (response.sourceStatus === "live" || response.sourceStatus === "stale" || response.sourceStatus === "unavailable")
    && typeof response.refreshedAt === "string";
}

function cacheTtl(response: CalendarResponse) {
  return response.sourceStatus === "live" ? CACHE_TTL_MS : STALE_RETRY_TTL_MS;
}

async function readDurableCalendarCache(): Promise<CalendarResponse | null> {
  if (bypassDurableCacheForTest || process.env.NODE_ENV === "test") return null;
  try {
    const db = await getDb();
    if (!db) return null;
    const [row] = await db.select().from(calendarCache).where(eq(calendarCache.key, CALENDAR_CACHE_KEY)).limit(1);
    return row && isCalendarResponse(row.payload) ? row.payload : null;
  } catch (error) {
    console.warn("[Calendar] Durable cache read failed:", error instanceof Error ? error.message : error);
    return null;
  }
}

async function writeDurableCalendarCache(response: CalendarResponse) {
  if (bypassDurableCacheForTest || process.env.NODE_ENV === "test") return;
  try {
    const db = await getDb();
    if (!db) return;
    await db.insert(calendarCache).values({
      key: CALENDAR_CACHE_KEY,
      payload: response,
      refreshedAt: new Date(response.refreshedAt),
      updatedAt: new Date(),
    }).onConflictDoUpdate({
      target: calendarCache.key,
      set: { payload: response, refreshedAt: new Date(response.refreshedAt), updatedAt: new Date() },
    });
  } catch (error) {
    console.warn("[Calendar] Durable cache write failed:", error instanceof Error ? error.message : error);
  }
}

async function retrieveCalendarFromSource(): Promise<CalendarResponse> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 12_000);

  try {
    const response = await fetch(FOREX_FACTORY_FEED_URL, {
      headers: {
        Accept: "application/json,text/json;q=0.9,*/*;q=0.8",
        "User-Agent": "Mozilla/5.0 (compatible; TradeFusionJournal/1.0; economic-calendar)",
      },
      signal: controller.signal,
    });
    if (!response.ok) throw new Error(`ForexFactory feed returned HTTP ${response.status}`);

    const contentType = response.headers.get("content-type") ?? "";
    const payload = await response.text();
    if (!contentType.includes("json") || /^\s*</.test(payload)) {
      throw new Error("ForexFactory returned a non-calendar response (rate limit or HTML challenge)");
    }

    const events = parseForexFactoryJson(payload);
    if (events.length === 0) throw new Error("ForexFactory feed contained no valid calendar events");

    const coverage = getCalendarCoverage(events);
    const coverageIsCurrent = hasCurrentCalendarCoverage(events);
    const calendarResponse: CalendarResponse = {
      events,
      sourceStatus: coverageIsCurrent ? "live" : "stale",
      refreshedAt: new Date().toISOString(),
      ...coverage,
      ...(coverageIsCurrent
        ? {}
        : {
            message: `ForexFactory's weekly export currently ends ${coverage.coverageEnd ?? "before today"}. Trade Fusion will retry shortly and will not label stale dates as upcoming coverage.`,
          }),
    };
    return calendarResponse;
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unable to retrieve the ForexFactory calendar.";
    console.error("[Calendar] ForexFactory retrieval failed:", message);
    return calendarFallback(
      cachedCalendar,
      "Live ForexFactory data is temporarily unavailable. Please try again after the source updates."
    );
  } finally {
    clearTimeout(timeout);
  }
}

export async function getLiveCalendarEvents(): Promise<CalendarResponse> {
  const now = Date.now();
  if (cachedCalendar && now - cachedAt < cacheTtl(cachedCalendar)) return cachedCalendar;

  const durableCache = await readDurableCalendarCache();
  if (durableCache) {
    const durableAge = now - new Date(durableCache.refreshedAt).getTime();
    if (durableAge < cacheTtl(durableCache)) {
      cachedCalendar = durableCache;
      cachedAt = now;
      return durableCache;
    }
    cachedCalendar = durableCache;
  }

  if (inFlightCalendarRequest) return inFlightCalendarRequest;
  inFlightCalendarRequest = retrieveCalendarFromSource();
  try {
    const response = await inFlightCalendarRequest;
    cachedCalendar = response;
    cachedAt = Date.now();
    await writeDurableCalendarCache(response);
    return response;
  } finally {
    inFlightCalendarRequest = null;
  }
}

export const calendarRouter = router({
  getEvents: publicProcedure.query(getLiveCalendarEvents),
});
