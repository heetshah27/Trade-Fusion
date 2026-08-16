import { and, desc, eq, inArray, sql } from "drizzle-orm";
import { TRPCError } from "@trpc/server";
import { z } from "zod";
import { protectedProcedure, router } from "./_core/trpc";
import { getDb } from "./db";
import { tradeJournalAttachments, tradeJournalEntries, trades } from "../drizzle/schema";
import { TRADE_JOURNAL_ATTACHMENT_RULES } from "../shared/tradeJournalConfig";
import { storagePut } from "./storage";

const journalInput = z.object({
  tradeId: z.number().int().positive(),
  tradeIdea: z.string().trim().max(5000).optional().default(""),
  marketContext: z.string().trim().max(5000).optional().default(""),
  executionReview: z.string().trim().max(5000).optional().default(""),
  reflection: z.string().trim().max(5000).optional().default(""),
  emotion: z.string().trim().max(48).optional().default(""),
  rating: z.number().int().min(1).max(5).nullable().optional().default(null),
});

const journalAttachmentSchema = z.object({
  journalEntryId: z.number().int().positive(),
  fileName: z.string().trim().min(1).max(255),
  mimeType: z.enum(TRADE_JOURNAL_ATTACHMENT_RULES.acceptedMimeTypes),
  dataUrl: z.string().min(32).max(Math.ceil(TRADE_JOURNAL_ATTACHMENT_RULES.maxBytesPerFile * 1.4) + 256),
});

export function isTradeJournalEntryOwnedByUser(entryUserId: number, authenticatedUserId: number) {
  return entryUserId === authenticatedUserId;
}

export function canAttachToTradeJournalEntry(entryUserId: number, authenticatedUserId: number) {
  return entryUserId === authenticatedUserId;
}

export function decodeTradeJournalImageDataUrl(dataUrl: string, expectedMimeType: string) {
  const match = dataUrl.match(/^data:([^;]+);base64,([A-Za-z0-9+/=]+)$/);
  if (!match || match[1] !== expectedMimeType) {
    throw new TRPCError({ code: "BAD_REQUEST", message: "Screenshot must be a valid PNG, JPG, or WebP image" });
  }
  const bytes = Buffer.from(match[2], "base64");
  if (!bytes.length || bytes.length > TRADE_JOURNAL_ATTACHMENT_RULES.maxBytesPerFile) {
    throw new TRPCError({ code: "PAYLOAD_TOO_LARGE", message: "Screenshot exceeds the 3 MB file limit" });
  }
  return bytes;
}

function databaseUnavailable() {
  return new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database not available" });
}

async function requireOwnedTrade(db: NonNullable<Awaited<ReturnType<typeof getDb>>>, userId: number, tradeId: number) {
  const result = await db.select().from(trades).where(and(eq(trades.id, tradeId), eq(trades.userId, userId))).limit(1);
  if (!result.length) throw new TRPCError({ code: "NOT_FOUND", message: "Live trade not found" });
  return result[0];
}

function clientAttachment(attachment: typeof tradeJournalAttachments.$inferSelect) {
  return { id: attachment.id, url: attachment.url, fileName: attachment.fileName, mimeType: attachment.mimeType, byteSize: attachment.byteSize, createdAt: attachment.createdAt };
}

function clientEntry(entry: typeof tradeJournalEntries.$inferSelect, trade?: typeof trades.$inferSelect, attachments: typeof tradeJournalAttachments.$inferSelect[] = []) {
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
    attachments: attachments.map(clientAttachment),
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

async function attachmentsForEntries(db: NonNullable<Awaited<ReturnType<typeof getDb>>>, userId: number, entryIds: number[]) {
  if (!entryIds.length) return [];
  return db.select().from(tradeJournalAttachments)
    .where(and(eq(tradeJournalAttachments.userId, userId), inArray(tradeJournalAttachments.journalEntryId, entryIds)))
    .orderBy(tradeJournalAttachments.createdAt);
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
    const attachments = await attachmentsForEntries(db, ctx.user.id, rows.map(row => row.entry.id));
    return rows.map(({ entry, trade }) => clientEntry(entry, trade, attachments.filter(attachment => attachment.journalEntryId === entry.id)));
  }),

  byTrade: protectedProcedure.input(z.object({ tradeId: z.number().int().positive() })).query(async ({ ctx, input }) => {
    const db = await getDb();
    if (!db) throw databaseUnavailable();
    const trade = await requireOwnedTrade(db, ctx.user.id, input.tradeId);
    const rows = await db.select().from(tradeJournalEntries)
      .where(and(eq(tradeJournalEntries.tradeId, input.tradeId), eq(tradeJournalEntries.userId, ctx.user.id))).limit(1);
    if (!rows.length) return null;
    const attachments = await attachmentsForEntries(db, ctx.user.id, [rows[0].id]);
    return clientEntry(rows[0], trade, attachments);
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
    const attachments = await attachmentsForEntries(db, ctx.user.id, [result[0].id]);
    return clientEntry(result[0], trade, attachments);
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

  uploadAttachment: protectedProcedure.input(journalAttachmentSchema).mutation(async ({ ctx, input }) => {
    const db = await getDb();
    if (!db) throw databaseUnavailable();
    const [entry] = await db.select().from(tradeJournalEntries)
      .where(and(eq(tradeJournalEntries.id, input.journalEntryId), eq(tradeJournalEntries.userId, ctx.user.id))).limit(1);
    if (!entry || !canAttachToTradeJournalEntry(entry.userId, ctx.user.id)) {
      throw new TRPCError({ code: "NOT_FOUND", message: "Private Journal entry not found" });
    }
    const bytes = decodeTradeJournalImageDataUrl(input.dataUrl, input.mimeType);
    const extension = input.mimeType === "image/jpeg" ? "jpg" : input.mimeType.split("/")[1];
    const attachment = await db.transaction(async tx => {
      await tx.execute(sql`select pg_advisory_xact_lock(${input.journalEntryId})`);
      const current = await tx.select({ id: tradeJournalAttachments.id }).from(tradeJournalAttachments)
        .where(and(eq(tradeJournalAttachments.journalEntryId, input.journalEntryId), eq(tradeJournalAttachments.userId, ctx.user.id)));
      if (current.length >= TRADE_JOURNAL_ATTACHMENT_RULES.maxFilesPerEntry) {
        throw new TRPCError({ code: "BAD_REQUEST", message: "A Journal entry can include up to four chart screenshots" });
      }
      const uploaded = await storagePut(
        `trade-journal/${ctx.user.id}/entries/${input.journalEntryId}/${crypto.randomUUID()}.${extension}`,
        bytes,
        input.mimeType
      );
      const [created] = await tx.insert(tradeJournalAttachments).values({
        journalEntryId: input.journalEntryId,
        userId: ctx.user.id,
        storageKey: uploaded.key,
        url: uploaded.url,
        fileName: input.fileName,
        mimeType: input.mimeType,
        byteSize: bytes.length,
      }).returning();
      return created;
    });
    return clientAttachment(attachment);
  }),

  removeAttachment: protectedProcedure.input(z.object({ attachmentId: z.number().int().positive() })).mutation(async ({ ctx, input }) => {
    const db = await getDb();
    if (!db) throw databaseUnavailable();
    const [attachment] = await db.select().from(tradeJournalAttachments)
      .where(and(eq(tradeJournalAttachments.id, input.attachmentId), eq(tradeJournalAttachments.userId, ctx.user.id))).limit(1);
    if (!attachment) throw new TRPCError({ code: "NOT_FOUND", message: "Screenshot not found" });
    await db.delete(tradeJournalAttachments).where(eq(tradeJournalAttachments.id, attachment.id));
    return { success: true };
  }),
});
