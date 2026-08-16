import { describe, expect, it } from "vitest";
import { buildEquityCurve } from "./equityCurve";

describe("buildEquityCurve", () => {
  it("sorts real trades by date and creates a stepped cumulative path from zero", () => {
    const curve = buildEquityCurve([
      { id: 2, date: "2026-08-14", pnl: 18 },
      { id: 1, date: "2026-08-12", pnl: -10 },
      { id: 3, date: "2026-08-15", pnl: 5 },
    ]);

    expect(curve?.points.map(point => point.balance)).toEqual([-10, 8, 13]);
    expect(curve?.linePath).toContain("H");
    expect(curve?.linePath).toContain("V");
    expect(curve?.areaPath).toContain("Z");
  });

  it("returns null without any recorded live trades", () => {
    expect(buildEquityCurve([])).toBeNull();
  });
});
