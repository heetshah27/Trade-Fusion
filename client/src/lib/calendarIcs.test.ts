import { describe, expect, it } from "vitest";
import { buildEconomicEventIcs, buildEconomicWeekIcs } from "./calendarIcs";

describe("economic calendar ICS exports", () => {
  const event = {
    id: "fomc",
    date: "2026-11-05",
    time: "2:00pm",
    country: "USD",
    event: "FOMC Rate Decision",
    impact: "high",
    forecast: "4.00%",
    previous: "4.25%",
  };

  it("converts New York source time to UTC and includes phone reminders", () => {
    const ics = buildEconomicEventIcs(event, new Date("2026-11-01T12:00:00Z"));
    expect(ics).toContain("DTSTART:20261105T190000Z");
    expect(ics).toContain("DTEND:20261105T193000Z");
    expect(ics.match(/BEGIN:VALARM/g)).toHaveLength(2);
    expect(ics).toContain("TRIGGER:-PT1H");
    expect(ics).toContain("TRIGGER:-PT15M");
    expect(ics).toContain("Forecast: 4.00%\\nPrevious: 4.25%");
  });

  it("packages multiple high-impact events into one calendar file", () => {
    const ics = buildEconomicWeekIcs([event, { ...event, id: "nfp", event: "Nonfarm Payrolls", date: "2026-11-06", time: "8:30am" }]);
    expect((ics.match(/BEGIN:VEVENT/g) ?? []).length).toBe(2);
    expect(ics).toContain("SUMMARY:USD · FOMC Rate Decision");
    expect(ics).toContain("SUMMARY:USD · Nonfarm Payrolls");
    expect(ics).toContain("END:VCALENDAR");
  });
});
