import { describe, expect, it } from "vitest";
import { easternTodayIso, formatRiskCountdown, nextHighImpactToday, sourceEasternTimestamp } from "./calendarRisk";

describe("Dashboard calendar risk helpers", () => {
  const now = new Date("2026-08-21T13:00:00.000Z");

  it("finds only the next high-impact event occurring today in New York time", () => {
    const next = nextHighImpactToday([
      { id: "low", date: "2026-08-21", time: "9:15am", country: "USD", event: "Low impact", impact: "low" },
      { id: "past", date: "2026-08-21", time: "8:30am", country: "USD", event: "Past CPI", impact: "high" },
      { id: "next", date: "2026-08-21", time: "9:45am", country: "USD", event: "Flash PMI", impact: "high" },
      { id: "tomorrow", date: "2026-08-22", time: "8:30am", country: "USD", event: "Tomorrow", impact: "high" },
    ], now);

    expect(easternTodayIso(now)).toBe("2026-08-21");
    expect(next?.event.id).toBe("next");
    expect(next && formatRiskCountdown(next.timestamp, now)).toBe("45m");
  });

  it("returns no timestamp for source entries without a precise clock time", () => {
    expect(sourceEasternTimestamp("2026-08-21", "All Day")).toBeNull();
  });
});
