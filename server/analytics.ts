import { eq } from "drizzle-orm";
import { protectedProcedure, router } from "./_core/trpc";
import { getDb } from "./db";
import { trades } from "../drizzle/schema";

export type AnalyticsTrade = { date: string; symbol: string; direction: "LONG" | "SHORT"; pnl: number; setupTag: string | null; marketSession: string | null };
export type ScopedAnalyticsTrade = AnalyticsTrade & { userId: number; source: "live" | "backtest" };

type PerformanceRow = {
  key: string;
  tradeCount: number;
  wins: number;
  losses: number;
  winRate: number;
  pnl: number;
  averagePnl: number;
  profitFactor: number | null;
};

function performance(key: string, records: AnalyticsTrade[]): PerformanceRow {
  const wins = records.filter(trade => trade.pnl > 0);
  const losses = records.filter(trade => trade.pnl < 0);
  const grossProfit = wins.reduce((total, trade) => total + trade.pnl, 0);
  const grossLoss = Math.abs(losses.reduce((total, trade) => total + trade.pnl, 0));
  const pnl = records.reduce((total, trade) => total + trade.pnl, 0);
  return {
    key,
    tradeCount: records.length,
    wins: wins.length,
    losses: losses.length,
    winRate: records.length ? (wins.length / records.length) * 100 : 0,
    pnl,
    averagePnl: records.length ? pnl / records.length : 0,
    profitFactor: grossLoss > 0 ? grossProfit / grossLoss : null,
  };
}

export function buildSetupAnalytics(records: AnalyticsTrade[]) {
  const by = (keyFor: (trade: AnalyticsTrade) => string) => {
    const groups = new Map<string, AnalyticsTrade[]>();
    records.forEach(trade => {
      const key = keyFor(trade);
      groups.set(key, [...(groups.get(key) ?? []), trade]);
    });
    return Array.from(groups.entries()).map(([key, items]) => performance(key, items)).sort((a, b) => b.pnl - a.pnl || b.tradeCount - a.tradeCount);
  };
  const weekdayNames = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
  return {
    summary: performance("All live journal trades", records),
    setups: by(trade => trade.setupTag?.trim() || "Untagged"),
    symbols: by(trade => trade.symbol),
    directions: by(trade => trade.direction === "LONG" ? "Long" : "Short"),
    sessions: by(trade => trade.marketSession?.trim() || "Unspecified"),
    weekdays: by(trade => weekdayNames[new Date(`${trade.date}T12:00:00Z`).getUTCDay()] ?? "Unknown"),
  };
}

export function buildMemberLiveAnalytics(records: ScopedAnalyticsTrade[], authenticatedUserId: number) {
  return buildSetupAnalytics(records.filter(record => record.userId === authenticatedUserId && record.source === "live"));
}

export const analyticsRouter = router({
  overview: protectedProcedure.query(async ({ ctx }) => {
    const db = await getDb();
    if (!db) throw new Error("Database not available");
    const rows = await db.select({ userId: trades.userId, date: trades.date, symbol: trades.symbol, direction: trades.direction, pnl: trades.pnl, setupTag: trades.setupTag, marketSession: trades.marketSession }).from(trades).where(eq(trades.userId, ctx.user.id));
    return buildMemberLiveAnalytics(rows.map(row => ({ ...row, pnl: Number(row.pnl), source: "live" })), ctx.user.id);
  }),
});
