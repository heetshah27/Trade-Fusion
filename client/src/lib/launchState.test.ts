import { describe, expect, it } from "vitest";
import { getLaunchState } from "./launchState";

describe("getLaunchState", () => {
  it("always completes the branded intro before deciding the authentication view", () => {
    expect(getLaunchState(false, false, false)).toBe("intro");
    expect(getLaunchState(false, false, true)).toBe("intro");
  });

  it("shows a short authentication check after the intro", () => {
    expect(getLaunchState(true, true, false)).toBe("checking-auth");
  });

  it("routes users to sign-in or the app based on their session", () => {
    expect(getLaunchState(true, false, false)).toBe("sign-in");
    expect(getLaunchState(true, false, true)).toBe("app");
  });
});
