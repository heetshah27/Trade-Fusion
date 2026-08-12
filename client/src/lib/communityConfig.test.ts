import { describe, expect, it } from "vitest";
import {
  COMMUNITY_ATTACHMENT_RULES,
  COMMUNITY_REACTIONS,
  TRADING_STYLES,
} from "@shared/communityConfig";

describe("Trader’s Room community rules", () => {
  it("limits chart and image attachments to safe image types and sizes", () => {
    expect(COMMUNITY_ATTACHMENT_RULES.maxFilesPerPost).toBe(2);
    expect(COMMUNITY_ATTACHMENT_RULES.maxBytesPerFile).toBe(3 * 1024 * 1024);
    expect(COMMUNITY_ATTACHMENT_RULES.acceptedMimeTypes).toEqual([
      "image/jpeg",
      "image/png",
      "image/webp",
    ]);
  });

  it("defines reaction and self-selected badge options without using journal data", () => {
    expect(COMMUNITY_REACTIONS).toEqual(["insightful", "support", "question"]);
    expect(TRADING_STYLES).toContain("day_trader");
  });
});
