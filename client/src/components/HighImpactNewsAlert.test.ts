import { describe, expect, it } from "vitest";
import { getUpcomingHighImpactEventsForTest } from "./HighImpactNewsAlert";

describe("high-impact news alert selection", () => {
  it("ignores medium-impact and already-published events and orders future events", () => {
    const now = new Date("2026-10-05T12:00:00.000Z").getTime();
    const events = [
      { id: "later", date: "2026-10-05", time: "10:00am", country: "USD", event: "Later CPI", impact: "high" },
      { id: "medium", date: "2026-10-05", time: "11:00am", country: "USD", event: "Medium Retail Sales", impact: "medium" },
      { id: "past", date: "2026-10-05", time: "7:00am", country: "USD", event: "Past Payrolls", impact: "high" },
      { id: "soon", date: "2026-10-05", time: "9:00am", country: "USD", event: "Soon Rate Decision", impact: "high" },
    ];

    expect(getUpcomingHighImpactEventsForTest(events, now).map(item => item.event.id)).toEqual(["soon", "later"]);
  });
});
