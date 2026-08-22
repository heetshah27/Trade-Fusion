import { afterEach, describe, expect, it, vi } from "vitest";
import {
  calendarFallback,
  getCalendarCoverage,
  getLiveCalendarEvents,
  hasCurrentCalendarCoverage,
  parseForexFactoryFeed,
  parseForexFactoryJson,
  resetCalendarCacheForTest,
  toIsoDate,
} from "./calendar";

const SAMPLE_FOREX_FACTORY_FEED = `<?xml version="1.0" encoding="windows-1252"?>
<weeklyevents>
  <event><title>Cash Rate</title><country>AUD</country><date><![CDATA[08-11-2026]]></date><time><![CDATA[4:30am]]></time><impact><![CDATA[High]]></impact><forecast><![CDATA[4.35%]]></forecast><previous><![CDATA[4.35%]]></previous></event>
  <event><title>Bank Holiday</title><country>JPY</country><date><![CDATA[08-10-2026]]></date><time><![CDATA[11:00pm]]></time><impact><![CDATA[Holiday]]></impact></event>
</weeklyevents>`;

const SAMPLE_FOREX_FACTORY_JSON = JSON.stringify([
  { title: "Core CPI y/y", country: "USD", date: "2026-08-17T08:30:00-04:00", impact: "High", forecast: "2.5%", previous: "2.6%" },
  { title: "Retail Sales m/m", country: "GBP", date: "2026-08-21T02:00:00-04:00", impact: "High", forecast: "-0.4%", previous: "1.0%" },
]);

describe("ForexFactory calendar parser", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
    resetCalendarCacheForTest();
  });

  it("converts legacy feed dates into date-only ISO strings without timezone drift", () => {
    expect(toIsoDate("08-11-2026")).toBe("2026-08-11");
    expect(toIsoDate("invalid-date")).toBeUndefined();
  });

  it("retains legacy XML parsing for diagnostics without inventing missing values", () => {
    const events = parseForexFactoryFeed(SAMPLE_FOREX_FACTORY_FEED);
    expect(events).toMatchObject([{ date: "2026-08-11", time: "4:30am", impact: "high" }, { date: "2026-08-10", impact: "holiday" }]);
  });

  it("parses source-published JSON timestamps in Eastern Time through the upcoming Friday coverage", () => {
    const events = parseForexFactoryJson(SAMPLE_FOREX_FACTORY_JSON);
    expect(events).toMatchObject([
      { date: "2026-08-17", time: "8:30am", country: "USD", event: "Core CPI y/y", impact: "high" },
      { date: "2026-08-21", time: "2:00am", country: "GBP", event: "Retail Sales m/m", impact: "high" },
    ]);
    expect(getCalendarCoverage(events)).toEqual({ coverageStart: "2026-08-17", coverageEnd: "2026-08-21" });
  });

  it("does not claim an old weekly export is current after its coverage has ended", () => {
    const oldEvents = parseForexFactoryJson(SAMPLE_FOREX_FACTORY_JSON.replaceAll("2026-08-17", "2026-08-10").replaceAll("2026-08-21", "2026-08-14"));
    expect(hasCurrentCalendarCoverage(oldEvents, new Date("2026-08-16T16:00:00.000Z"))).toBe(false);
  });

  it("uses the source JSON export and preserves its upcoming ET records", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(
        new Response(SAMPLE_FOREX_FACTORY_JSON, { headers: { "content-type": "application/json" } })
      )
    );

    const response = await getLiveCalendarEvents();
    expect(response.sourceStatus).toBe("live");
    expect(response.coverageEnd).toBe("2026-08-21");
    expect(response.events.some(event => event.impact === "high" && event.event === "Retail Sales m/m")).toBe(true);
  });

  it("deduplicates concurrent source reads so multiple calendar viewers share one upstream request", async () => {
    let resolveFetch: ((response: Response) => void) | undefined;
    const fetchMock = vi.fn().mockImplementation(() => new Promise<Response>(resolve => { resolveFetch = resolve; }));
    vi.stubGlobal("fetch", fetchMock);

    const first = getLiveCalendarEvents();
    const second = getLiveCalendarEvents();
    await Promise.resolve();
    resolveFetch?.(new Response(SAMPLE_FOREX_FACTORY_JSON, { headers: { "content-type": "application/json" } }));

    const [firstResponse, secondResponse] = await Promise.all([first, second]);
    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(firstResponse.events).toHaveLength(2);
    expect(secondResponse.events).toHaveLength(2);
  });

  it("rejects an HTML challenge rather than parsing it as an empty calendar", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(
        new Response("<html><title>Rate Limited</title></html>", { headers: { "content-type": "text/html" } })
      )
    );

    const response = await getLiveCalendarEvents();
    expect(response.sourceStatus).toBe("unavailable");
    expect(response.events).toEqual([]);
  });

  it("returns a truthful unavailable state with no events when the source cannot be reached", async () => {
    vi.stubGlobal("fetch", vi.fn().mockRejectedValue(new Error("Source blocked")));
    const response = await getLiveCalendarEvents();
    expect(response.sourceStatus).toBe("unavailable");
    expect(response.events).toEqual([]);
    expect(response.message).toContain("temporarily unavailable");
  });

  it("retains the last verified calendar when the source is rate-limited", () => {
    const cached = { events: parseForexFactoryJson(SAMPLE_FOREX_FACTORY_JSON), sourceStatus: "live" as const, refreshedAt: "2026-08-17T12:00:00.000Z" };
    const response = calendarFallback(cached, "Source unavailable");
    expect(response.sourceStatus).toBe("stale");
    expect(response.events).toHaveLength(2);
    expect(response.message).toContain("last verified calendar");
  });
});
