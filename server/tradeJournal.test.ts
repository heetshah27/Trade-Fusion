import { describe, expect, it } from "vitest";
import { canAttachToTradeJournalEntry, decodeTradeJournalImageDataUrl, isTradeJournalEntryOwnedByUser } from "./tradeJournal";

describe("private trade Journal ownership", () => {
  it("allows an entry only to the member who owns it", () => {
    expect(isTradeJournalEntryOwnedByUser(31, 31)).toBe(true);
    expect(isTradeJournalEntryOwnedByUser(31, 87)).toBe(false);
  });

  it("allows screenshots only on a Journal entry owned by the current member", () => {
    expect(canAttachToTradeJournalEntry(31, 31)).toBe(true);
    expect(canAttachToTradeJournalEntry(31, 87)).toBe(false);
  });

  it("accepts a matching image data URL and rejects mismatched or malformed screenshot data", () => {
    const bytes = decodeTradeJournalImageDataUrl("data:image/png;base64,aGVsbG8=", "image/png");
    expect(bytes.toString()).toBe("hello");
    expect(() => decodeTradeJournalImageDataUrl("data:image/jpeg;base64,aGVsbG8=", "image/png")).toThrow("valid PNG, JPG, or WebP");
    expect(() => decodeTradeJournalImageDataUrl("not-an-image", "image/png")).toThrow("valid PNG, JPG, or WebP");
  });
});
