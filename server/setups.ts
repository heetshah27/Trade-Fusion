import { and, eq } from "drizzle-orm";
import { TRPCError } from "@trpc/server";
import { z } from "zod";
import { tradeSetups } from "../drizzle/schema";
import { getDb } from "./db";
import { protectedProcedure, router } from "./_core/trpc";

const SetupInput = z.object({
  name: z.string().trim().min(2).max(80),
  description: z.string().trim().max(500).optional().default(""),
  color: z.string().trim().regex(/^#[0-9A-Fa-f]{6}$/).optional().default("#38BDF8"),
});

export function setupSlug(name: string) {
  return name.toLowerCase().trim().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "").slice(0, 96);
}

function unavailable() {
  return new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database not available" });
}

export const setupsRouter = router({
  list: protectedProcedure.query(async ({ ctx }) => {
    const db = await getDb();
    if (!db) throw unavailable();
    return db.select().from(tradeSetups).where(eq(tradeSetups.userId, ctx.user.id));
  }),

  create: protectedProcedure.input(SetupInput).mutation(async ({ ctx, input }) => {
    const db = await getDb();
    if (!db) throw unavailable();
    const slug = setupSlug(input.name);
    if (!slug) throw new TRPCError({ code: "BAD_REQUEST", message: "Setup name must include letters or numbers" });
    const existing = await db.select().from(tradeSetups).where(and(eq(tradeSetups.userId, ctx.user.id), eq(tradeSetups.slug, slug)));
    if (existing.length) throw new TRPCError({ code: "CONFLICT", message: "You already have a setup with this name" });
    const created = await db.insert(tradeSetups).values({ userId: ctx.user.id, name: input.name, slug, description: input.description || null, color: input.color, isArchived: false }).returning();
    return created[0];
  }),

  update: protectedProcedure.input(SetupInput.extend({ id: z.number().int().positive() })).mutation(async ({ ctx, input }) => {
    const db = await getDb();
    if (!db) throw unavailable();
    const existing = await db.select().from(tradeSetups).where(and(eq(tradeSetups.id, input.id), eq(tradeSetups.userId, ctx.user.id)));
    if (!existing.length) throw new TRPCError({ code: "NOT_FOUND", message: "Setup not found" });
    const slug = setupSlug(input.name);
    if (!slug) throw new TRPCError({ code: "BAD_REQUEST", message: "Setup name must include letters or numbers" });
    const duplicate = await db.select().from(tradeSetups).where(and(eq(tradeSetups.userId, ctx.user.id), eq(tradeSetups.slug, slug)));
    if (duplicate.some(setup => setup.id !== input.id)) throw new TRPCError({ code: "CONFLICT", message: "You already have a setup with this name" });
    const updated = await db.update(tradeSetups).set({ name: input.name, slug, description: input.description || null, color: input.color, updatedAt: new Date() }).where(eq(tradeSetups.id, input.id)).returning();
    return updated[0];
  }),

  archive: protectedProcedure.input(z.object({ id: z.number(), isArchived: z.boolean() })).mutation(async ({ ctx, input }) => {
    const db = await getDb();
    if (!db) throw unavailable();
    const existing = await db.select().from(tradeSetups).where(and(eq(tradeSetups.id, input.id), eq(tradeSetups.userId, ctx.user.id)));
    if (!existing.length) throw new TRPCError({ code: "NOT_FOUND", message: "Setup not found" });
    const updated = await db.update(tradeSetups).set({ isArchived: input.isArchived, updatedAt: new Date() }).where(eq(tradeSetups.id, input.id)).returning();
    return updated[0];
  }),
});
