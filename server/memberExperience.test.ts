import { describe, expect, it, vi } from "vitest";
import { decodeProfilePhoto, emailAvatarUrl } from "./account";
import { createCommunityNotification, shouldCreateCommunityNotification } from "./notifications";

describe("member experience helpers", () => {
  it("creates a deterministic email-linked avatar URL without exposing the email itself", () => {
    const url = emailAvatarUrl("  MyEmail@Example.com ");
    expect(url).toBe("https://www.gravatar.com/avatar/60a6c20d49f49bc210ac98d7e47c74a0?s=256&d=identicon&r=g");
    expect(url).not.toContain("MyEmail");
    expect(emailAvatarUrl(null)).toBeNull();
  });

  it("accepts a valid profile image signature and rejects spoofed image data", () => {
    const pngDataUrl = "data:image/png;base64,iVBORw0KGgo=";
    expect(decodeProfilePhoto(pngDataUrl, "image/png")).toEqual(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]));
    expect(() => decodeProfilePhoto("data:image/png;base64,bm90LWEtcG5n", "image/png")).toThrow("does not match");
    expect(() => decodeProfilePhoto(pngDataUrl, "image/jpeg")).toThrow("valid image data URL");
  });

  it("does not create private notifications for a member’s own community actions", () => {
    expect(shouldCreateCommunityNotification(7, 7)).toBe(false);
    expect(shouldCreateCommunityNotification(7, 9)).toBe(true);
  });

  it("writes recipient notifications only for another member’s community action", async () => {
    const values = vi.fn();
    const db = { insert: vi.fn(() => ({ values })) };
    await createCommunityNotification(db, { recipientId: 7, actorId: 7, type: "post_reply", postId: 11 });
    expect(db.insert).not.toHaveBeenCalled();

    await createCommunityNotification(db, { recipientId: 7, actorId: 9, type: "post_reaction", postId: 11, reaction: "insightful" });
    expect(db.insert).toHaveBeenCalledOnce();
    expect(values).toHaveBeenCalledWith({ recipientId: 7, actorId: 9, type: "post_reaction", postId: 11, reaction: "insightful" });
  });
});
