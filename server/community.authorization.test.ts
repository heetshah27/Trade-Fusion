import { describe, expect, it } from "vitest";
import { canAttachToCommunityPost, canDeleteCommunityPost, canModerateCommunity, reactionMutationAction } from "./community";

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

  it("allows image uploads only from the discussion author", () => {
    expect(canAttachToCommunityPost(7, 7)).toBe(true);
    expect(canAttachToCommunityPost(7, 9)).toBe(false);
  });

  it("removes an identical reaction and upserts a changed or new reaction", () => {
    expect(reactionMutationAction(null, "insightful")).toBe("upsert");
    expect(reactionMutationAction("insightful", "support")).toBe("upsert");
    expect(reactionMutationAction("question", "question")).toBe("remove");
  });
});
