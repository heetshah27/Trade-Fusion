import { canAttachToCommunityPost, canDeleteCommunityPost, canModerateCommunity, isCommunityFounder, reactionMutationAction, toPublicCommunityAuthor } from "./community";
import { describe, expect, it } from "vitest";

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

  it("reserves the Founder · Moderator designation for the configured project owner", () => {
    expect(isCommunityFounder("project-owner", "project-owner")).toBe(true);
    expect(isCommunityFounder("another-admin", "project-owner")).toBe(false);
    expect(isCommunityFounder("project-owner", "")).toBe(false);
  });

  it("derives the founder flag without exposing an author’s OAuth identifier", () => {
    const author = toPublicCommunityAuthor({ id: 3, authorOpenId: "project-owner", authorName: "Founder" }, "project-owner");
    expect(author).toEqual({ id: 3, authorName: "Founder", isFounder: true });
    expect("authorOpenId" in author).toBe(false);
  });

  it("removes an identical reaction and upserts a changed or new reaction", () => {
    expect(reactionMutationAction(null, "insightful")).toBe("upsert");
    expect(reactionMutationAction("insightful", "support")).toBe("upsert");
    expect(reactionMutationAction("question", "question")).toBe("remove");
  });
});
