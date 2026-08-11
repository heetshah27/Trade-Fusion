import { describe, expect, it } from "vitest";
import { toEasternCalendarDisplay } from "./calendarTime";

describe("toEasternCalendarDisplay", () => {
  it("converts a summer ForexFactory UTC release to U.S. Eastern daylight time", () => {
    expect(toEasternCalendarDisplay("2026-08-12", "12:30pm")).toEqual({
      dateLabel: "Aug 12, 2026",
      timeLabel: "8:30 AM",
    });
  });

  it("moves the displayed date when a UTC event falls on the prior Eastern day", () => {
    expect(toEasternCalendarDisplay("2026-08-10", "1:30am")).toEqual({
      dateLabel: "Aug 9, 2026",
      timeLabel: "9:30 PM",
    });
  });

  it("uses the winter Eastern offset after daylight saving time ends", () => {
    expect(toEasternCalendarDisplay("2026-01-15", "1:30pm")).toEqual({
      dateLabel: "Jan 15, 2026",
      timeLabel: "8:30 AM",
    });
  });
});
