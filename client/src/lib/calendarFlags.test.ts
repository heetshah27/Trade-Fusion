import { describe, expect, it } from "vitest";
import { getCalendarCountry } from "./calendarFlags";

describe("getCalendarCountry", () => {
  it("maps commonly displayed ForexFactory currency codes to the corresponding flags", () => {
    expect(getCalendarCountry("USD")).toEqual({
      flag: "🇺🇸",
      label: "United States",
    });
    expect(getCalendarCountry("EUR")).toEqual({
      flag: "🇪🇺",
      label: "European Union",
    });
    expect(getCalendarCountry("JPY")).toEqual({
      flag: "🇯🇵",
      label: "Japan",
    });
  });

  it("uses an international fallback for an unrecognized feed code", () => {
    expect(getCalendarCountry("XYZ")).toEqual({
      flag: "🌐",
      label: "International",
    });
  });
});
