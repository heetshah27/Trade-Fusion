import { z } from "zod";
import { eq } from "drizzle-orm";
import { TRPCError } from "@trpc/server";
import { protectedProcedure, router } from "./_core/trpc";
import { getDb } from "./db";
import { trades as tradesTable, Trade as DbTrade } from "../drizzle/schema";

// Schema for trade validation (matches database schema)
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
  notes: z.string().optional().default(""),
});

export type Trade = z.infer<typeof TradeSchema>;

export const tradesRouter = router({
  // Get all trades for the current user
  list: protectedProcedure.query(async ({ ctx }) => {
    const db = await getDb();
    if (!db) {
      throw new TRPCError({
        code: "INTERNAL_SERVER_ERROR",
        message: "Database not available",
      });
    }

    const userId = ctx.user.id;
    const userTrades = await db
      .select()
      .from(tradesTable)
      .where(eq(tradesTable.userId, userId));

    return userTrades.map((t) => ({
      id: t.id,
      date: t.date,
      symbol: t.symbol,
      direction: t.direction,
      entryPrice: Number(t.entryPrice),
      exitPrice: Number(t.exitPrice),
      quantity: Number(t.quantity),
      pnl: Number(t.pnl),
      fees: Number(t.fees),
      notes: t.notes || "",
    }));
  }),

  // Create a new trade
  create: protectedProcedure
    .input(TradeSchema.omit({ id: true }))
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Database not available",
        });
      }

      const userId = ctx.user.id;
      const result = await db
        .insert(tradesTable)
        .values({
          userId,
          date: input.date,
          symbol: input.symbol,
          direction: input.direction,
          entryPrice: String(input.entryPrice),
          exitPrice: String(input.exitPrice),
          quantity: String(input.quantity),
          pnl: String(input.pnl),
          fees: String(input.fees || 0),
          notes: input.notes,
        })
        .returning();

      const trade = result[0];
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
        notes: trade.notes || "",
      };
    }),

  // Update an existing trade
  update: protectedProcedure
    .input(TradeSchema)
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Database not available",
        });
      }

      const userId = ctx.user.id;

      // Verify trade belongs to user
      const existing = await db
        .select()
        .from(tradesTable)
        .where(eq(tradesTable.id, input.id));

      if (existing.length === 0 || existing[0].userId !== userId) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Trade not found",
        });
      }

      const result = await db
        .update(tradesTable)
        .set({
          date: input.date,
          symbol: input.symbol,
          direction: input.direction,
          entryPrice: String(input.entryPrice),
          exitPrice: String(input.exitPrice),
          quantity: String(input.quantity),
          pnl: String(input.pnl),
          fees: String(input.fees || 0),
          notes: input.notes,
        })
        .where(eq(tradesTable.id, input.id))
        .returning();

      const trade = result[0];
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
        notes: trade.notes || "",
      };
    }),

  // Delete a trade
  delete: protectedProcedure
    .input(z.object({ id: z.number() }))
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Database not available",
        });
      }

      const userId = ctx.user.id;

      // Verify trade belongs to user
      const existing = await db
        .select()
        .from(tradesTable)
        .where(eq(tradesTable.id, input.id));

      if (existing.length === 0 || existing[0].userId !== userId) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Trade not found",
        });
      }

      await db.delete(tradesTable).where(eq(tradesTable.id, input.id));

      return { success: true };
    }),
});
