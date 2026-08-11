import { describe, expect, it } from "vitest";
import { isTradeOwnedByUser } from "./trades";

describe("trade ownership isolation", () => {
  it("allows a user to access only trades assigned to the same account id", () => {
    expect(isTradeOwnedByUser(42, 42)).toBe(true);
    expect(isTradeOwnedByUser(42, 99)).toBe(false);
  });
});
