import { beforeEach, describe, expect, it, vi } from "vitest";

const databaseMocks = vi.hoisted(() => ({ getDb: vi.fn() }));

vi.mock("./db", () => ({ getDb: databaseMocks.getDb }));

import { analyticsRouter } from "./analytics";
import { backtestTrades, trades } from "../drizzle/schema";

function mockLiveTradeQuery(rows: Array<Record<string, unknown>>, backtestRows: Array<Record<string, unknown>> = []) {
  const where = vi.fn(async () => rows);
  const backtestWhere = vi.fn(async () => backtestRows);
  const leftJoin = vi.fn(() => ({ where }));
  const from = vi.fn((table: unknown) => table === trades ? ({ leftJoin }) : ({ where: backtestWhere }));
  const select = vi.fn(() => ({ from }));
  databaseMocks.getDb.mockResolvedValue({ select });
  return { select, from, leftJoin, where, backtestWhere };
}

function overviewFor(userId: number) {
  return analyticsRouter.createCaller({ user: { id: userId } } as never).overview();
}

describe("analytics.overview protected-procedure privacy", () => {
  beforeEach(() => databaseMocks.getDb.mockReset());

  it("returns only the authenticated member's live journal rows even if a faulty datasource supplies another member's row", async () => {
    mockLiveTradeQuery([
      { userId: 7, date: "2026-08-10", symbol: "EURUSD", direction: "LONG", pnl: "100", setupTag: "Breakout", marketSession: "London" },
      { userId: 19, date: "2026-08-10", symbol: "BTCUSD", direction: "SHORT", pnl: "900", setupTag: "Other member", marketSession: "Asia" },
    ]);

    const overview = await overviewFor(7);

    expect(overview.summary).toMatchObject({ tradeCount: 1, pnl: 100 });
    expect(overview.setups).toEqual([expect.objectContaining({ key: "Breakout", pnl: 100 })]);
    expect(overview.symbols).toEqual([expect.objectContaining({ key: "EURUSD", pnl: 100 })]);
  });

  it("ignores simulated Backtest fixtures because the procedure performs a single live-trades query", async () => {
    const simulatedBacktestTrades = [{ userId: 7, sessionId: 44, pnl: "500", setupTag: "Simulation only" }];
    const query = mockLiveTradeQuery([{ userId: 7, date: "2026-08-11", symbol: "XAUUSD", direction: "LONG", pnl: "45", setupTag: "Pullback", marketSession: "New York" }], simulatedBacktestTrades);

    const overview = await overviewFor(7);

    expect(query.select).toHaveBeenCalledTimes(1);
    expect(query.from).toHaveBeenCalledWith(trades);
    expect(query.from).not.toHaveBeenCalledWith(backtestTrades);
    expect(query.backtestWhere).not.toHaveBeenCalled();
    expect(overview.summary).toMatchObject({ tradeCount: 1, pnl: 45 });
    expect(overview.setups).toEqual([expect.objectContaining({ key: "Pullback", pnl: 45 })]);
  });
});
