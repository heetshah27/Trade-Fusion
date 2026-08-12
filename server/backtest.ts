import { TRPCError } from "@trpc/server";
import { and, desc, eq } from "drizzle-orm";
import { z } from "zod";
import { backtestSessions, backtestTrades } from "../drizzle/schema";
import { getDb } from "./db";
import { protectedProcedure, router } from "./_core/trpc";

const dateSchema = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Use a YYYY-MM-DD date");
const numericInput = z.union([z.string(), z.number()]);

const sessionInput = z.object({
  strategyName: z.string().trim().min(2).max(120),
  symbol: z.string().trim().min(1).max(20).transform(value => value.toUpperCase()),
  timeframe: z.string().trim().min(1).max(16),
  startDate: dateSchema,
  endDate: dateSchema,
  initialBalance: numericInput,
  notes: z.string().trim().max(3000).optional().default(""),
});

const tradeInput = z.object({
  sessionId: z.number().int().positive(),
  date: dateSchema,
  direction: z.enum(["LONG", "SHORT"]),
  entryPrice: numericInput,
  exitPrice: numericInput,
  quantity: numericInput,
  stopLoss: numericInput.optional().nullable(),
  takeProfit: numericInput.optional().nullable(),
  fees: numericInput.default(0),
  setupTag: z.string().trim().max(80).optional().default(""),
  notes: z.string().trim().max(3000).optional().default(""),
});

type BacktestTradeRow = typeof backtestTrades.$inferSelect;

function databaseUnavailable() {
  return new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database not available" });
}

function numberValue(value: string | number | null | undefined) {
  return Number(value ?? 0);
}

function computedPnl(input: z.infer<typeof tradeInput>) {
  const entry = numberValue(input.entryPrice);
  const exit = numberValue(input.exitPrice);
  const quantity = numberValue(input.quantity);
  return input.direction === "LONG" ? (exit - entry) * quantity : (entry - exit) * quantity;
}

function computedRMultiple(input: z.infer<typeof tradeInput>) {
  if (input.stopLoss === null || input.stopLoss === undefined || input.stopLoss === "") return null;
  const entry = numberValue(input.entryPrice);
  const stop = numberValue(input.stopLoss);
  const quantity = numberValue(input.quantity);
  const risk = Math.abs(entry - stop) * quantity;
  return risk > 0 ? computedPnl(input) / risk : null;
}

export function isBacktestSessionOwnedByUser(sessionUserId: number, authenticatedUserId: number) {
  return sessionUserId === authenticatedUserId;
}

function toClientTrade(trade: BacktestTradeRow) {
  return {
    id: trade.id,
    sessionId: trade.sessionId,
    date: trade.date,
    direction: trade.direction,
    entryPrice: numberValue(trade.entryPrice),
    exitPrice: numberValue(trade.exitPrice),
    quantity: numberValue(trade.quantity),
    stopLoss: trade.stopLoss === null ? null : numberValue(trade.stopLoss),
    takeProfit: trade.takeProfit === null ? null : numberValue(trade.takeProfit),
    pnl: numberValue(trade.pnl),
    fees: numberValue(trade.fees),
    rMultiple: trade.rMultiple === null ? null : numberValue(trade.rMultiple),
    setupTag: trade.setupTag || "",
    notes: trade.notes || "",
  };
}

export function calculateBacktestMetrics(trades: BacktestTradeRow[], initialBalance: number) {
  const ordered = [...trades].sort((left, right) => left.date.localeCompare(right.date) || left.id - right.id);
  const netResults = ordered.map(trade => numberValue(trade.pnl) - numberValue(trade.fees));
  const wins = netResults.filter(result => result > 0);
  const losses = netResults.filter(result => result < 0);
  const totalPnl = netResults.reduce((sum, result) => sum + result, 0);
  const grossProfit = wins.reduce((sum, result) => sum + result, 0);
  const grossLoss = Math.abs(losses.reduce((sum, result) => sum + result, 0));
  let balance = initialBalance;
  let peak = initialBalance;
  let maxDrawdown = 0;
  netResults.forEach(result => {
    balance += result;
    peak = Math.max(peak, balance);
    maxDrawdown = Math.max(maxDrawdown, peak - balance);
  });
  const rMultiples = trades.map(trade => trade.rMultiple === null ? null : numberValue(trade.rMultiple)).filter((value): value is number => value !== null);
  return {
    totalTrades: trades.length,
    wins: wins.length,
    losses: losses.length,
    winRate: trades.length ? (wins.length / trades.length) * 100 : 0,
    totalPnl,
    endingBalance: initialBalance + totalPnl,
    profitFactor: grossLoss ? grossProfit / grossLoss : grossProfit > 0 ? null : 0,
    maxDrawdown,
    averageR: rMultiples.length ? rMultiples.reduce((sum, value) => sum + value, 0) / rMultiples.length : null,
  };
}

async function getOwnedSession(sessionId: number, userId: number) {
  const db = await getDb();
  if (!db) throw databaseUnavailable();
  const [session] = await db.select().from(backtestSessions).where(and(eq(backtestSessions.id, sessionId), eq(backtestSessions.userId, userId)));
  if (!session) throw new TRPCError({ code: "NOT_FOUND", message: "Backtest session not found" });
  return { db, session };
}

export const backtestRouter = router({
  listSessions: protectedProcedure.query(async ({ ctx }) => {
    const db = await getDb();
    if (!db) throw databaseUnavailable();
    const sessions = await db.select().from(backtestSessions).where(eq(backtestSessions.userId, ctx.user.id)).orderBy(desc(backtestSessions.createdAt));
    return Promise.all(sessions.map(async session => {
      const trades = await db.select().from(backtestTrades).where(eq(backtestTrades.sessionId, session.id));
      return {
        ...session,
        initialBalance: numberValue(session.initialBalance),
        notes: session.notes || "",
        metrics: calculateBacktestMetrics(trades, numberValue(session.initialBalance)),
      };
    }));
  }),

  getSession: protectedProcedure.input(z.object({ id: z.number().int().positive() })).query(async ({ ctx, input }) => {
    const { db, session } = await getOwnedSession(input.id, ctx.user.id);
    const trades = await db.select().from(backtestTrades).where(eq(backtestTrades.sessionId, session.id)).orderBy(desc(backtestTrades.date), desc(backtestTrades.createdAt));
    return {
      ...session,
      initialBalance: numberValue(session.initialBalance),
      notes: session.notes || "",
      trades: trades.map(toClientTrade),
      metrics: calculateBacktestMetrics(trades, numberValue(session.initialBalance)),
    };
  }),

  createSession: protectedProcedure.input(sessionInput).mutation(async ({ ctx, input }) => {
    if (input.endDate < input.startDate) throw new TRPCError({ code: "BAD_REQUEST", message: "End date must be after start date" });
    const db = await getDb();
    if (!db) throw databaseUnavailable();
    const [created] = await db.insert(backtestSessions).values({
      userId: ctx.user.id,
      strategyName: input.strategyName,
      symbol: input.symbol,
      timeframe: input.timeframe,
      startDate: input.startDate,
      endDate: input.endDate,
      initialBalance: String(input.initialBalance),
      notes: input.notes || null,
    }).returning();
    return { ...created, initialBalance: numberValue(created.initialBalance), notes: created.notes || "" };
  }),

  archiveSession: protectedProcedure.input(z.object({ id: z.number().int().positive() })).mutation(async ({ ctx, input }) => {
    const { db, session } = await getOwnedSession(input.id, ctx.user.id);
    await db.update(backtestSessions).set({ status: "archived", updatedAt: new Date() }).where(eq(backtestSessions.id, session.id));
    return { success: true };
  }),

  deleteSession: protectedProcedure.input(z.object({ id: z.number().int().positive() })).mutation(async ({ ctx, input }) => {
    const { db, session } = await getOwnedSession(input.id, ctx.user.id);
    await db.delete(backtestSessions).where(eq(backtestSessions.id, session.id));
    return { success: true };
  }),

  createTrade: protectedProcedure.input(tradeInput).mutation(async ({ ctx, input }) => {
    const { db, session } = await getOwnedSession(input.sessionId, ctx.user.id);
    if (session.status !== "active") throw new TRPCError({ code: "BAD_REQUEST", message: "Archived sessions cannot receive simulated trades" });
    const pnl = computedPnl(input);
    const rMultiple = computedRMultiple(input);
    const [created] = await db.insert(backtestTrades).values({
      sessionId: session.id,
      userId: ctx.user.id,
      date: input.date,
      direction: input.direction,
      entryPrice: String(input.entryPrice),
      exitPrice: String(input.exitPrice),
      quantity: String(input.quantity),
      stopLoss: input.stopLoss === null || input.stopLoss === undefined || input.stopLoss === "" ? null : String(input.stopLoss),
      takeProfit: input.takeProfit === null || input.takeProfit === undefined || input.takeProfit === "" ? null : String(input.takeProfit),
      pnl: pnl.toFixed(2),
      fees: String(input.fees || 0),
      rMultiple: rMultiple === null ? null : rMultiple.toFixed(2),
      setupTag: input.setupTag || null,
      notes: input.notes || null,
    }).returning();
    return toClientTrade(created);
  }),

  deleteTrade: protectedProcedure.input(z.object({ id: z.number().int().positive() })).mutation(async ({ ctx, input }) => {
    const db = await getDb();
    if (!db) throw databaseUnavailable();
    const [trade] = await db.select().from(backtestTrades).where(and(eq(backtestTrades.id, input.id), eq(backtestTrades.userId, ctx.user.id)));
    if (!trade) throw new TRPCError({ code: "NOT_FOUND", message: "Simulated trade not found" });
    await db.delete(backtestTrades).where(eq(backtestTrades.id, trade.id));
    return { success: true };
  }),
});
