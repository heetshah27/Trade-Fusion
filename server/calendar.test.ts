import { afterEach, describe, expect, it, vi } from "vitest";
import {
  calendarFallback,
  getCalendarCoverage,
  getLiveCalendarEvents,
  parseForexFactoryFeed,
  toIsoDate,
} from "./calendar";

const SAMPLE_FOREX_FACTORY_FEED = `<?xml version="1.0" encoding="windows-1252"?>
<weeklyevents>
  <event>
    <title>Cash Rate</title>
    <country>AUD</country>
    <date><![CDATA[08-11-2026]]></date>
    <time><![CDATA[4:30am]]></time>
    <impact><![CDATA[High]]></impact>
    <forecast><![CDATA[4.35%]]></forecast>
    <previous><![CDATA[4.35%]]></previous>
    <url><![CDATA[https://www.forexfactory.com/calendar/21-au-cash-rate]]></url>
  </event>
  <event>
    <title>Bank Holiday</title>
    <country>JPY</country>
    <date><![CDATA[08-10-2026]]></date>
    <time><![CDATA[11:00pm]]></time>
    <impact><![CDATA[Holiday]]></impact>
    <forecast />
    <previous />
    <url><![CDATA[https://www.forexfactory.com/calendar/393-jn-bank-holiday]]></url>
  </event>
</weeklyevents>`;

describe("ForexFactory calendar parser", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("converts feed dates into date-only ISO strings without timezone drift", () => {
    expect(toIsoDate("08-11-2026")).toBe("2026-08-11");
    expect(toIsoDate("invalid-date")).toBeUndefined();
  });

  it("parses actual ForexFactory feed fields without inventing missing values", () => {
    const events = parseForexFactoryFeed(SAMPLE_FOREX_FACTORY_FEED);

    expect(events).toHaveLength(2);
    expect(events[0]).toMatchObject({
      date: "2026-08-11",
      time: "4:30am",
      country: "AUD",
      event: "Cash Rate",
      impact: "high",
      forecast: "4.35%",
      previous: "4.35%",
    });
    expect(events[1]).toMatchObject({
      date: "2026-08-10",
      time: "11:00pm",
      country: "JPY",
      event: "Bank Holiday",
      impact: "holiday",
    });
    expect(events[1]?.forecast).toBeUndefined();
    expect(events[1]?.previous).toBeUndefined();
  });

  it("retains source-published Friday events and reports the weekly coverage end date", () => {
    const fridayFeed = SAMPLE_FOREX_FACTORY_FEED.replace(
      "</weeklyevents>",
      `<event><title>Retail Sales</title><country>USD</country><date><![CDATA[08-14-2026]]></date><time><![CDATA[8:30am]]></time><impact><![CDATA[High]]></impact></event></weeklyevents>`
    );
    const events = parseForexFactoryFeed(fridayFeed);
    expect(events.some(event => event.date === "2026-08-14" && event.event === "Retail Sales")).toBe(true);
    expect(getCalendarCoverage(events)).toEqual({ coverageStart: "2026-08-10", coverageEnd: "2026-08-14" });
  });

  it("discards incomplete source records instead of filling them with mock values", () => {
    const events = parseForexFactoryFeed(`
      <weeklyevents>
        <event><title>Incomplete Event</title><country>USD</country></event>
      </weeklyevents>
    `);

    expect(events).toEqual([]);
  });

  it("returns a truthful unavailable state with no events when the source cannot be reached", async () => {
    vi.stubGlobal("fetch", vi.fn().mockRejectedValue(new Error("Source blocked")));

    const response = await getLiveCalendarEvents();

    expect(response.sourceStatus).toBe("unavailable");
    expect(response.events).toEqual([]);
    expect(response.message).toContain("temporarily unavailable");
  });

  it("retains the last verified weekly events when the source is rate-limited", () => {
    const cached = {
      events: parseForexFactoryFeed(SAMPLE_FOREX_FACTORY_FEED),
      sourceStatus: "live" as const,
      refreshedAt: "2026-08-12T12:00:00.000Z",
    };
    const response = calendarFallback(cached, "Source unavailable");
    expect(response.sourceStatus).toBe("stale");
    expect(response.events).toHaveLength(2);
    expect(response.message).toContain("last verified weekly calendar");
  });
});
