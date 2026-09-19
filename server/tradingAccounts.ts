import { and, asc, desc, eq } from "drizzle-orm";
import { TRPCError } from "@trpc/server";
import { z } from "zod";
import { trades, tradingAccounts } from "../drizzle/schema";
import { getDb } from "./db";
import { protectedProcedure, router } from "./_core/trpc";

const accountTypeSchema = z.enum([
  "none",
  "personal_funds",
  "live_funded",
  "challenge_phase_1",
  "challenge_phase_2",
  "demo",
]);

const accountFields = z.object({
  name: z.string().trim().min(1, "Enter an account name").max(80),
  initialBalance: z.coerce.number().finite().min(0, "Initial balance cannot be negative"),
  currentBalance: z.coerce.number().finite().min(0, "Current balance cannot be negative"),
  accountType: accountTypeSchema.default("none"),
});

function unavailable() {
  return new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Trading accounts are temporarily unavailable" });
}

function toClientAccount(account: typeof tradingAccounts.$inferSelect) {
  return {
    id: account.id,
    name: account.name,
    initialBalance: Number(account.initialBalance),
    currentBalance: Number(account.currentBalance),
    accountType: account.accountType,
    createdAt: account.createdAt,
    updatedAt: account.updatedAt,
  };
}

export type AccountPerformance = {
  tradeCount: number;
  wins: number;
  losses: number;
  netPnl: number;
  winRate: number;
  profitFactor: number | null;
  maxDrawdown: number;
  maxDrawdownPercent: number;
};

export function buildAccountPerformance(initialBalance: number, records: Array<{ pnl: string | number }>): AccountPerformance {
  const wins = records.filter(record => Number(record.pnl) > 0);
  const losses = records.filter(record => Number(record.pnl) < 0);
  const grossProfit = wins.reduce((total, record) => total + Number(record.pnl), 0);
  const grossLoss = Math.abs(losses.reduce((total, record) => total + Number(record.pnl), 0));
  const netPnl = records.reduce((total, record) => total + Number(record.pnl), 0);
  let equity = initialBalance;
  let peak = initialBalance;
  let maxDrawdown = 0;
  let maxDrawdownPercent = 0;
  for (const record of records) {
    equity += Number(record.pnl);
    peak = Math.max(peak, equity);
    const drawdown = Math.max(0, peak - equity);
    maxDrawdown = Math.max(maxDrawdown, drawdown);
    maxDrawdownPercent = Math.max(maxDrawdownPercent, peak > 0 ? (drawdown / peak) * 100 : 0);
  }
  return {
    tradeCount: records.length,
    wins: wins.length,
    losses: losses.length,
    netPnl,
    winRate: records.length ? (wins.length / records.length) * 100 : 0,
    profitFactor: grossLoss > 0 ? grossProfit / grossLoss : null,
    maxDrawdown,
    maxDrawdownPercent,
  };
}

export const tradingAccountsRouter = router({
  list: protectedProcedure.query(async ({ ctx }) => {
    const db = await getDb();
    if (!db) throw unavailable();
    const [rows, accountTrades] = await Promise.all([
      db.select().from(tradingAccounts).where(eq(tradingAccounts.userId, ctx.user.id)).orderBy(desc(tradingAccounts.updatedAt)),
      db.select({ accountId: trades.accountId, pnl: trades.pnl, date: trades.date, createdAt: trades.createdAt }).from(trades).where(eq(trades.userId, ctx.user.id)).orderBy(asc(trades.date), asc(trades.createdAt)),
    ]);
    const tradesByAccount = new Map<number, Array<{ pnl: string | number }>>();
    for (const trade of accountTrades) {
      if (trade.accountId === null) continue;
      tradesByAccount.set(trade.accountId, [...(tradesByAccount.get(trade.accountId) ?? []), trade]);
    }
    return rows.map(account => ({ ...toClientAccount(account), performance: buildAccountPerformance(Number(account.initialBalance), tradesByAccount.get(account.id) ?? []) }));
  }),

  create: protectedProcedure.input(accountFields).mutation(async ({ ctx, input }) => {
    const db = await getDb();
    if (!db) throw unavailable();
    const [created] = await db.insert(tradingAccounts).values({
      userId: ctx.user.id,
      name: input.name,
      initialBalance: input.initialBalance.toFixed(2),
      currentBalance: input.currentBalance.toFixed(2),
      accountType: input.accountType,
    }).returning();
    return toClientAccount(created);
  }),

  update: protectedProcedure.input(accountFields.extend({ id: z.number().int().positive() })).mutation(async ({ ctx, input }) => {
    const db = await getDb();
    if (!db) throw unavailable();
    const [updated] = await db.update(tradingAccounts).set({
      name: input.name,
      initialBalance: input.initialBalance.toFixed(2),
      currentBalance: input.currentBalance.toFixed(2),
      accountType: input.accountType,
      updatedAt: new Date(),
    }).where(and(eq(tradingAccounts.id, input.id), eq(tradingAccounts.userId, ctx.user.id))).returning();
    if (!updated) throw new TRPCError({ code: "NOT_FOUND", message: "Trading account not found" });
    return toClientAccount(updated);
  }),

  delete: protectedProcedure.input(z.object({ id: z.number().int().positive() })).mutation(async ({ ctx, input }) => {
    const db = await getDb();
    if (!db) throw unavailable();
    const deleted = await db.delete(tradingAccounts).where(and(eq(tradingAccounts.id, input.id), eq(tradingAccounts.userId, ctx.user.id))).returning({ id: tradingAccounts.id });
    if (!deleted.length) throw new TRPCError({ code: "NOT_FOUND", message: "Trading account not found" });
    return { success: true } as const;
  }),
});

export type TradingAccountType = z.infer<typeof accountTypeSchema>;
