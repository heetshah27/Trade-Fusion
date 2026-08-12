import { describe, expect, it } from "vitest";
import { COMMUNITY_ATTACHMENT_RULES } from "../shared/communityConfig";
import { decodeImageDataUrl } from "./community";

describe("Trader’s Room image validation", () => {
  it("decodes an image matching its claimed MIME type", () => {
    const bytes = decodeImageDataUrl("data:image/png;base64,aGVsbG8=", "image/png");
    expect(bytes.toString()).toBe("hello");
  });

  it("rejects a mismatched or malformed image payload", () => {
    expect(() => decodeImageDataUrl("data:image/jpeg;base64,aGVsbG8=", "image/png")).toThrow("valid image data URL");
    expect(() => decodeImageDataUrl("not-a-data-url", "image/png")).toThrow("valid image data URL");
  });

  it("rejects image payloads over the configured 3 MB limit", () => {
    const oversized = Buffer.alloc(COMMUNITY_ATTACHMENT_RULES.maxBytesPerFile + 1).toString("base64");
    expect(() => decodeImageDataUrl(`data:image/webp;base64,${oversized}`, "image/webp")).toThrow("3 MB attachment limit");
  });
});
