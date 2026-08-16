import { TRPCError } from "@trpc/server";
import { desc, eq } from "drizzle-orm";
import { z } from "zod";
import { contactInquiries } from "../drizzle/schema";
import { ENV } from "./_core/env";
import { notifyOwner } from "./_core/notification";
import { protectedProcedure, publicProcedure, router } from "./_core/trpc";
import { getDb } from "./db";

const CONTACT_WINDOW_MS = 10 * 60 * 1000;
const CONTACT_MAX_SUBMISSIONS_PER_WINDOW = 3;
const recentContactSubmissions = new Map<string, number[]>();

const contactInput = z.object({
  name: z.string().trim().min(2, "Please enter your name").max(80),
  email: z.string().trim().email("Please enter a valid email address").max(320),
  message: z.string().trim().min(10, "Please share a little more detail").max(2000),
  website: z.string().max(200).optional().default(""),
});

export function canReadContactInquiries(userOpenId: string, ownerOpenId: string) {
  return Boolean(ownerOpenId) && userOpenId === ownerOpenId;
}

export function hasClearContactHoneypot(value: string) {
  return value.trim() === "";
}

export function publicContactRateKey(forwardedFor: string | string[] | undefined, requestIp?: string) {
  const forwarded = Array.isArray(forwardedFor) ? forwardedFor[0] : forwardedFor;
  return forwarded?.split(",")[0]?.trim() || requestIp || "anonymous";
}

export function contactSubmissionAllowed(attempts: number[], now: number) {
  const windowStart = now - CONTACT_WINDOW_MS;
  return attempts.filter(timestamp => timestamp > windowStart).length < CONTACT_MAX_SUBMISSIONS_PER_WINDOW;
}

function consumeContactSubmission(key: string, now: number) {
  const previous = recentContactSubmissions.get(key) ?? [];
  const recent = previous.filter(timestamp => timestamp > now - CONTACT_WINDOW_MS);
  if (!contactSubmissionAllowed(recent, now)) return false;
  recent.push(now);
  recentContactSubmissions.set(key, recent);
  return true;
}

function databaseUnavailable() {
  return new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Inquiry service is temporarily unavailable" });
}

export const contactRouter = router({
  submit: publicProcedure.input(contactInput).mutation(async ({ ctx, input }) => {
    if (!hasClearContactHoneypot(input.website)) {
      return { accepted: true, ownerNotified: false } as const;
    }

    const rateKey = publicContactRateKey(ctx.req.headers["x-forwarded-for"], ctx.req.ip);
    if (!consumeContactSubmission(rateKey, Date.now())) {
      throw new TRPCError({ code: "TOO_MANY_REQUESTS", message: "Please wait a few minutes before sending another message" });
    }

    const db = await getDb();
    if (!db) throw databaseUnavailable();
    const [inquiry] = await db.insert(contactInquiries).values({
      name: input.name,
      email: input.email.toLowerCase(),
      message: input.message,
    }).returning();

    let ownerNotified = false;
    try {
      ownerNotified = await notifyOwner({
        title: `New Trade Fusion inquiry from ${inquiry.name}`,
        content: `Email: ${inquiry.email}\n\n${inquiry.message}`,
      });
    } catch (error) {
      console.warn("[Contact] Inquiry saved but owner notification was unavailable", error);
    }

    return { accepted: true, ownerNotified, inquiryId: inquiry.id } as const;
  }),

  list: protectedProcedure.query(async ({ ctx }) => {
    if (!canReadContactInquiries(ctx.user.openId, ENV.ownerOpenId)) {
      throw new TRPCError({ code: "FORBIDDEN", message: "Only the project owner can read inquiries" });
    }
    const db = await getDb();
    if (!db) throw databaseUnavailable();
    return db.select().from(contactInquiries).orderBy(desc(contactInquiries.createdAt)).limit(100);
  }),

  markRead: protectedProcedure.input(z.object({ id: z.number().int().positive() })).mutation(async ({ ctx, input }) => {
    if (!canReadContactInquiries(ctx.user.openId, ENV.ownerOpenId)) {
      throw new TRPCError({ code: "FORBIDDEN", message: "Only the project owner can manage inquiries" });
    }
    const db = await getDb();
    if (!db) throw databaseUnavailable();
    const [updated] = await db.update(contactInquiries)
      .set({ status: "read", readAt: new Date() })
      .where(eq(contactInquiries.id, input.id))
      .returning();
    if (!updated) throw new TRPCError({ code: "NOT_FOUND", message: "Inquiry not found" });
    return updated;
  }),
});
