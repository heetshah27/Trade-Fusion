import { and, desc, eq } from "drizzle-orm";
import { TRPCError } from "@trpc/server";
import { z } from "zod";
import { protectedProcedure, router } from "./_core/trpc";
import { getDb } from "./db";
import { tradeJournalEntries, trades } from "../drizzle/schema";

const journalInput = z.object({
  tradeId: z.number().int().positive(),
  tradeIdea: z.string().trim().max(5000).optional().default(""),
  marketContext: z.string().trim().max(5000).optional().default(""),
  executionReview: z.string().trim().max(5000).optional().default(""),
  reflection: z.string().trim().max(5000).optional().default(""),
  emotion: z.string().trim().max(48).optional().default(""),
  rating: z.number().int().min(1).max(5).nullable().optional().default(null),
});

export function isTradeJournalEntryOwnedByUser(entryUserId: number, authenticatedUserId: number) {
  return entryUserId === authenticatedUserId;
}

function databaseUnavailable() {
  return new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database not available" });
}

async function requireOwnedTrade(db: NonNullable<Awaited<ReturnType<typeof getDb>>>, userId: number, tradeId: number) {
  const result = await db.select().from(trades).where(and(eq(trades.id, tradeId), eq(trades.userId, userId))).limit(1);
  if (!result.length) throw new TRPCError({ code: "NOT_FOUND", message: "Live trade not found" });
  return result[0];
}

function clientEntry(entry: typeof tradeJournalEntries.$inferSelect, trade?: typeof trades.$inferSelect) {
  return {
    id: entry.id,
    tradeId: entry.tradeId,
    tradeIdea: entry.tradeIdea || "",
    marketContext: entry.marketContext || "",
    executionReview: entry.executionReview || "",
    reflection: entry.reflection || "",
    emotion: entry.emotion || "",
    rating: entry.rating,
    createdAt: entry.createdAt,
    updatedAt: entry.updatedAt,
    trade: trade ? {
      id: trade.id,
      date: trade.date,
      symbol: trade.symbol,
      direction: trade.direction,
      pnl: Number(trade.pnl),
      setupTag: trade.setupTag || "",
    } : undefined,
  };
}

export const tradeJournalRouter = router({
  list: protectedProcedure.query(async ({ ctx }) => {
    const db = await getDb();
    if (!db) throw databaseUnavailable();
    const rows = await db.select({ entry: tradeJournalEntries, trade: trades })
      .from(tradeJournalEntries)
      .innerJoin(trades, eq(tradeJournalEntries.tradeId, trades.id))
      .where(and(eq(tradeJournalEntries.userId, ctx.user.id), eq(trades.userId, ctx.user.id)))
      .orderBy(desc(tradeJournalEntries.updatedAt));
    return rows.map(({ entry, trade }) => clientEntry(entry, trade));
  }),

  byTrade: protectedProcedure.input(z.object({ tradeId: z.number().int().positive() })).query(async ({ ctx, input }) => {
    const db = await getDb();
    if (!db) throw databaseUnavailable();
    const trade = await requireOwnedTrade(db, ctx.user.id, input.tradeId);
    const rows = await db.select().from(tradeJournalEntries)
      .where(and(eq(tradeJournalEntries.tradeId, input.tradeId), eq(tradeJournalEntries.userId, ctx.user.id))).limit(1);
    return rows.length ? clientEntry(rows[0], trade) : null;
  }),

  upsert: protectedProcedure.input(journalInput).mutation(async ({ ctx, input }) => {
    const db = await getDb();
    if (!db) throw databaseUnavailable();
    const trade = await requireOwnedTrade(db, ctx.user.id, input.tradeId);
    const values = {
      tradeIdea: input.tradeIdea || null,
      marketContext: input.marketContext || null,
      executionReview: input.executionReview || null,
      reflection: input.reflection || null,
      emotion: input.emotion || null,
      rating: input.rating,
      updatedAt: new Date(),
    };
    const result = await db.insert(tradeJournalEntries).values({ userId: ctx.user.id, tradeId: input.tradeId, ...values })
      .onConflictDoUpdate({ target: [tradeJournalEntries.userId, tradeJournalEntries.tradeId], set: values })
      .returning();
    return clientEntry(result[0], trade);
  }),

  delete: protectedProcedure.input(z.object({ id: z.number().int().positive() })).mutation(async ({ ctx, input }) => {
    const db = await getDb();
    if (!db) throw databaseUnavailable();
    const rows = await db.select().from(tradeJournalEntries)
      .where(and(eq(tradeJournalEntries.id, input.id), eq(tradeJournalEntries.userId, ctx.user.id))).limit(1);
    if (!rows.length || !isTradeJournalEntryOwnedByUser(rows[0].userId, ctx.user.id)) {
      throw new TRPCError({ code: "NOT_FOUND", message: "Journal entry not found" });
    }
    await db.delete(tradeJournalEntries).where(eq(tradeJournalEntries.id, input.id));
    return { success: true };
  }),
});
