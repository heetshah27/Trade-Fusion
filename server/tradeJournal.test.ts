import { describe, expect, it } from "vitest";
import { isTradeJournalEntryOwnedByUser } from "./tradeJournal";

describe("private trade Journal ownership", () => {
  it("allows an entry only to the member who owns it", () => {
    expect(isTradeJournalEntryOwnedByUser(31, 31)).toBe(true);
    expect(isTradeJournalEntryOwnedByUser(31, 87)).toBe(false);
  });
});
