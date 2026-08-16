import { describe, expect, it } from "vitest";
import { toEasternCalendarDisplay } from "./calendarTime";

describe("toEasternCalendarDisplay", () => {
  it("preserves a summer ForexFactory JSON export clock time already published in Eastern time", () => {
    expect(toEasternCalendarDisplay("2026-08-12", "8:30am")).toEqual({
      dateLabel: "Aug 12, 2026",
      timeLabel: "8:30 AM",
    });
  });

  it("does not shift a source-published Eastern event onto the prior date", () => {
    expect(toEasternCalendarDisplay("2026-08-10", "1:30am")).toEqual({
      dateLabel: "Aug 10, 2026",
      timeLabel: "1:30 AM",
    });
  });

  it("formats winter source-published Eastern times without an additional offset", () => {
    expect(toEasternCalendarDisplay("2026-01-15", "8:30am")).toEqual({
      dateLabel: "Jan 15, 2026",
      timeLabel: "8:30 AM",
    });
  });
});
