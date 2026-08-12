import { describe, expect, it } from "vitest";
import { dashboardReveal, shouldRunLandingMotion } from "./landingMotion";

describe("landing dashboard reveal", () => {
  it("starts the dashboard slightly below and softened before revealing it", () => {
    expect(dashboardReveal.hidden).toEqual({ opacity: 0, y: 48, scale: 0.975 });
    expect(dashboardReveal.visible).toEqual({ opacity: 1, y: 0, scale: 1 });
  });

  it("does not run non-essential motion when reduced motion is preferred", () => {
    expect(shouldRunLandingMotion(false, true)).toBe(true);
    expect(shouldRunLandingMotion(true, true)).toBe(false);
    expect(shouldRunLandingMotion(false, false)).toBe(false);
  });
});
