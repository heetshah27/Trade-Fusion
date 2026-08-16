import { and, eq } from "drizzle-orm";
import { TRPCError } from "@trpc/server";
import { z } from "zod";
import { protectedProcedure, router } from "./_core/trpc";
import { getDb } from "./db";
import { tradeSetups, trades as tradesTable } from "../drizzle/schema";
import { enforceFreeTradeLimit } from "./membership";

const TradeSchema = z.object({
  id: z.number(),
  date: z.string(),
  symbol: z.string(),
  direction: z.enum(["LONG", "SHORT"]),
  entryPrice: z.string().or(z.number()),
  exitPrice: z.string().or(z.number()),
  quantity: z.string().or(z.number()),
  pnl: z.string().or(z.number()),
  fees: z.string().or(z.number()).default(0),
  setupId: z.number().int().positive().nullable().optional().default(null),
  setupTag: z.string().trim().max(80).optional().default(""),
  marketSession: z.enum(["Asia", "London", "New York", "Other", ""]).optional().default(""),
  instrumentCategory: z.enum(["forex", "metals", "crypto", "indices", "equities", "options", "other", ""]).optional().default(""),
  tradeQuality: z.enum(["A_PLUS", "VALID", "FORCED", "RULE_BREAK", ""]).optional().default(""),
  ruleFollowed: z.boolean().nullable().optional().default(null),
  notes: z.string().optional().default(""),
});

export type Trade = z.infer<typeof TradeSchema>;

export function isTradeOwnedByUser(tradeUserId: number, authenticatedUserId: number): boolean {
  return tradeUserId === authenticatedUserId;
}

function toClientTrade(trade: typeof tradesTable.$inferSelect) {
  return {
    id: trade.id,
    date: trade.date,
    symbol: trade.symbol,
    direction: trade.direction,
    entryPrice: Number(trade.entryPrice),
    exitPrice: Number(trade.exitPrice),
    quantity: Number(trade.quantity),
    pnl: Number(trade.pnl),
    fees: Number(trade.fees),
    setupId: trade.setupId,
    setupTag: trade.setupTag || "",
    marketSession: trade.marketSession || "",
    instrumentCategory: trade.instrumentCategory || "",
    tradeQuality: trade.tradeQuality || "",
    ruleFollowed: trade.ruleFollowed,
    notes: trade.notes || "",
  };
}

function databaseUnavailable() {
  return new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database not available" });
}

async function setupNameForOwner(db: NonNullable<Awaited<ReturnType<typeof getDb>>>, userId: number, setupId: number | null) {
  if (!setupId) return null;
  const setup = await db.select().from(tradeSetups).where(and(eq(tradeSetups.id, setupId), eq(tradeSetups.userId, userId)));
  if (!setup.length) throw new TRPCError({ code: "FORBIDDEN", message: "Selected setup is unavailable" });
  return setup[0].name;
}

export const tradesRouter = router({
  list: protectedProcedure.query(async ({ ctx }) => {
    const db = await getDb();
    if (!db) throw databaseUnavailable();
    const userTrades = await db.select().from(tradesTable).where(eq(tradesTable.userId, ctx.user.id));
    return userTrades.map(toClientTrade);
  }),

  create: protectedProcedure.input(TradeSchema.omit({ id: true })).mutation(async ({ ctx, input }) => {
    await enforceFreeTradeLimit(ctx.user.id);
    const db = await getDb();
    if (!db) throw databaseUnavailable();
    const setupName = await setupNameForOwner(db, ctx.user.id, input.setupId);
    const result = await db.insert(tradesTable).values({
      userId: ctx.user.id,
      date: input.date,
      symbol: input.symbol,
      direction: input.direction,
      entryPrice: String(input.entryPrice),
      exitPrice: String(input.exitPrice),
      quantity: String(input.quantity),
      pnl: String(input.pnl),
      fees: String(input.fees || 0),
      setupId: input.setupId,
      setupTag: setupName || input.setupTag || null,
      marketSession: input.marketSession || null,
      instrumentCategory: input.instrumentCategory || null,
      tradeQuality: input.tradeQuality || null,
      ruleFollowed: input.ruleFollowed,
      notes: input.notes,
    }).returning();
    return toClientTrade(result[0]);
  }),

  update: protectedProcedure.input(TradeSchema).mutation(async ({ ctx, input }) => {
    const db = await getDb();
    if (!db) throw databaseUnavailable();
    const existing = await db.select().from(tradesTable).where(eq(tradesTable.id, input.id));
    if (existing.length === 0 || !isTradeOwnedByUser(existing[0].userId, ctx.user.id)) {
      throw new TRPCError({ code: "NOT_FOUND", message: "Trade not found" });
    }
    const setupName = await setupNameForOwner(db, ctx.user.id, input.setupId);
    const result = await db.update(tradesTable).set({
      date: input.date,
      symbol: input.symbol,
      direction: input.direction,
      entryPrice: String(input.entryPrice),
      exitPrice: String(input.exitPrice),
      quantity: String(input.quantity),
      pnl: String(input.pnl),
      fees: String(input.fees || 0),
      setupId: input.setupId,
      setupTag: setupName || input.setupTag || null,
      marketSession: input.marketSession || null,
      instrumentCategory: input.instrumentCategory || null,
      tradeQuality: input.tradeQuality || null,
      ruleFollowed: input.ruleFollowed,
      notes: input.notes,
    }).where(eq(tradesTable.id, input.id)).returning();
    return toClientTrade(result[0]);
  }),

  delete: protectedProcedure.input(z.object({ id: z.number() })).mutation(async ({ ctx, input }) => {
    const db = await getDb();
    if (!db) throw databaseUnavailable();
    const existing = await db.select().from(tradesTable).where(eq(tradesTable.id, input.id));
    if (existing.length === 0 || !isTradeOwnedByUser(existing[0].userId, ctx.user.id)) {
      throw new TRPCError({ code: "NOT_FOUND", message: "Trade not found" });
    }
    await db.delete(tradesTable).where(eq(tradesTable.id, input.id));
    return { success: true };
  }),
});
