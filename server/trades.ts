import { z } from "zod";
import { protectedProcedure, router } from "./_core/trpc";

// Schema for trade validation
const TradeSchema = z.object({
  id: z.string(),
  date: z.string(),
  symbol: z.string(),
  direction: z.enum(["LONG", "SHORT"]),
  entryPrice: z.number(),
  exitPrice: z.number(),
  quantity: z.number(),
  pnl: z.number(),
  fees: z.number().default(0),
  notes: z.string().optional().default(""),
});

export type Trade = z.infer<typeof TradeSchema>;

// In-memory storage per user (will be replaced with database)
const userTrades = new Map<number, Trade[]>();

export const tradesRouter = router({
  // Get all trades for the current user
  list: protectedProcedure.query(({ ctx }) => {
    const userId = ctx.user.id;
    return userTrades.get(userId) || [];
  }),

  // Create a new trade
  create: protectedProcedure
    .input(TradeSchema.omit({ id: true }))
    .mutation(({ ctx, input }) => {
      const userId = ctx.user.id;
      const trade: Trade = {
        id: Math.random().toString(36).slice(2, 10) + Date.now().toString(36),
        ...input,
      };

      const trades = userTrades.get(userId) || [];
      trades.push(trade);
      userTrades.set(userId, trades);

      return trade;
    }),

  // Update an existing trade
  update: protectedProcedure
    .input(TradeSchema)
    .mutation(({ ctx, input }) => {
      const userId = ctx.user.id;
      const trades = userTrades.get(userId) || [];

      const index = trades.findIndex((t) => t.id === input.id);
      if (index === -1) {
        throw new Error("Trade not found");
      }

      trades[index] = input as Trade;
      userTrades.set(userId, trades);

      return trades[index];
    }),

  // Delete a trade
  delete: protectedProcedure
    .input(z.object({ id: z.string() }))
    .mutation(({ ctx, input }) => {
      const userId = ctx.user.id;
      const trades = userTrades.get(userId) || [];

      const filtered = trades.filter((t) => t.id !== input.id);
      userTrades.set(userId, filtered);

      return { success: true };
    }),
});
