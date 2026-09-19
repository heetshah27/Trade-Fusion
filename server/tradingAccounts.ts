import { and, desc, eq } from "drizzle-orm";
import { TRPCError } from "@trpc/server";
import { z } from "zod";
import { tradingAccounts } from "../drizzle/schema";
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

export const tradingAccountsRouter = router({
  list: protectedProcedure.query(async ({ ctx }) => {
    const db = await getDb();
    if (!db) throw unavailable();
    const rows = await db.select().from(tradingAccounts).where(eq(tradingAccounts.userId, ctx.user.id)).orderBy(desc(tradingAccounts.updatedAt));
    return rows.map(toClientAccount);
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
