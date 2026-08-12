import { describe, expect, it } from "vitest";
import { canDeleteCommunityPost, canModerateCommunity } from "./community";

describe("Trader’s Room authorization", () => {
  it("allows only administrators to access moderation authority", () => {
    expect(canModerateCommunity("admin")).toBe(true);
    expect(canModerateCommunity("user")).toBe(false);
  });

  it("allows authors to remove their own posts while protecting other members’ posts", () => {
    expect(canDeleteCommunityPost(7, 7, "user")).toBe(true);
    expect(canDeleteCommunityPost(7, 9, "user")).toBe(false);
    expect(canDeleteCommunityPost(7, 9, "admin")).toBe(true);
  });
});
