import { describe, expect, it } from "vitest";
import { setupSlug } from "./setups";

describe("private setup library helpers", () => {
  it("normalizes a member's setup name into a stable private lookup key", () => {
    expect(setupSlug("  London Breakout / Retest  ")).toBe("london-breakout-retest");
  });

  it("does not generate an empty setup key from punctuation-only input", () => {
    expect(setupSlug("---")).toBe("");
  });
});
