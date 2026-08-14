import { eq } from "drizzle-orm";
import { TRPCError } from "@trpc/server";
import { z } from "zod";
import { protectedProcedure, router } from "./_core/trpc";
import { getDb } from "./db";
import { trades as tradesTable } from "../drizzle/schema";

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
  setupTag: z.string().trim().max(80).optional().default(""),
  marketSession: z.enum(["Asia", "London", "New York", "Other", ""]).optional().default(""),
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
    setupTag: trade.setupTag || "",
    marketSession: trade.marketSession || "",
    notes: trade.notes || "",
  };
}

function databaseUnavailable() {
  return new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database not available" });
}

export const tradesRouter = router({
  list: protectedProcedure.query(async ({ ctx }) => {
    const db = await getDb();
    if (!db) throw databaseUnavailable();
    const userTrades = await db.select().from(tradesTable).where(eq(tradesTable.userId, ctx.user.id));
    return userTrades.map(toClientTrade);
  }),

  create: protectedProcedure.input(TradeSchema.omit({ id: true })).mutation(async ({ ctx, input }) => {
    const db = await getDb();
    if (!db) throw databaseUnavailable();
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
      setupTag: input.setupTag || null,
      marketSession: input.marketSession || null,
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
    const result = await db.update(tradesTable).set({
      date: input.date,
      symbol: input.symbol,
      direction: input.direction,
      entryPrice: String(input.entryPrice),
      exitPrice: String(input.exitPrice),
      quantity: String(input.quantity),
      pnl: String(input.pnl),
      fees: String(input.fees || 0),
      setupTag: input.setupTag || null,
      marketSession: input.marketSession || null,
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
