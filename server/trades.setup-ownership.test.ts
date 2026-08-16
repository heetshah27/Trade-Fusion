import { beforeEach, describe, expect, it, vi } from "vitest";

const databaseMocks = vi.hoisted(() => ({ getDb: vi.fn() }));

vi.mock("./db", () => ({ getDb: databaseMocks.getDb }));
vi.mock("./membership", () => ({ enforceFreeTradeLimit: vi.fn() }));

import { tradesRouter } from "./trades";
import { tradeSetups } from "../drizzle/schema";

function callerFor(userId: number) {
  return tradesRouter.createCaller({ user: { id: userId } } as never);
}

const tradeInput = {
  date: "2026-08-14",
  symbol: "XAUUSD",
  direction: "LONG" as const,
  entryPrice: 2400,
  exitPrice: 2410,
  quantity: 1,
  pnl: 10,
  fees: 0,
  setupId: 77,
  setupTag: "Untrusted input",
  marketSession: "London" as const,
  instrumentCategory: "metals" as const,
  tradeQuality: "A_PLUS" as const,
  ruleFollowed: true,
  notes: "Private journal record",
};

describe("manual trade structured setup ownership", () => {
  beforeEach(() => databaseMocks.getDb.mockReset());

  it("rejects linking a manual live trade to a setup outside the authenticated member's library", async () => {
    const where = vi.fn(async () => []);
    const from = vi.fn(() => ({ where }));
    databaseMocks.getDb.mockResolvedValue({ select: vi.fn(() => ({ from })), insert: vi.fn() });

    await expect(callerFor(7).create(tradeInput)).rejects.toMatchObject({ code: "FORBIDDEN" });
    expect(from).toHaveBeenCalledWith(tradeSetups);
  });

  it("uses the validated owner setup name rather than a caller-supplied free-text label", async () => {
    const where = vi.fn(async () => [{ id: 77, userId: 7, name: "London Breakout" }]);
    const from = vi.fn(() => ({ where }));
    const returning = vi.fn(async () => [{ id: 5, userId: 7, ...tradeInput, setupTag: "London Breakout", marketSession: "London", instrumentCategory: "metals", tradeQuality: "A_PLUS", ruleFollowed: true }]);
    const values = vi.fn(() => ({ returning }));
    databaseMocks.getDb.mockResolvedValue({ select: vi.fn(() => ({ from })), insert: vi.fn(() => ({ values })) });

    const result = await callerFor(7).create(tradeInput);

    expect(values).toHaveBeenCalledWith(expect.objectContaining({ setupId: 77, setupTag: "London Breakout", userId: 7 }));
    expect(result).toMatchObject({ setupId: 77, setupTag: "London Breakout", instrumentCategory: "metals", tradeQuality: "A_PLUS", ruleFollowed: true });
  });
});
