import { and, desc, eq, isNull } from "drizzle-orm";
import { z } from "zod";
import { communityNotifications, users } from "../drizzle/schema";
import type { CommunityReaction } from "../shared/communityConfig";
import { getDb } from "./db";
import { protectedProcedure, router } from "./_core/trpc";

export type CommunityNotificationType = "post_reply" | "post_reaction" | "comment_reaction";

export function shouldCreateCommunityNotification(recipientId: number, actorId: number) {
  return recipientId !== actorId;
}

export async function createCommunityNotification(
  db: any,
  input: {
    recipientId: number;
    actorId: number;
    type: CommunityNotificationType;
    postId: number;
    commentId?: number;
    reaction?: CommunityReaction;
  }
) {
  if (!shouldCreateCommunityNotification(input.recipientId, input.actorId)) return;
  await db.insert(communityNotifications).values(input);
}

function databaseUnavailable(): never {
  throw new Error("Community database unavailable");
}

export const notificationsRouter = router({
  list: protectedProcedure.query(async ({ ctx }) => {
    const db = await getDb();
    if (!db) databaseUnavailable();
    const rows = await db
      .select({
        id: communityNotifications.id,
        type: communityNotifications.type,
        postId: communityNotifications.postId,
        commentId: communityNotifications.commentId,
        reaction: communityNotifications.reaction,
        readAt: communityNotifications.readAt,
        createdAt: communityNotifications.createdAt,
        actorName: users.name,
      })
      .from(communityNotifications)
      .innerJoin(users, eq(communityNotifications.actorId, users.id))
      .where(eq(communityNotifications.recipientId, ctx.user.id))
      .orderBy(desc(communityNotifications.createdAt))
      .limit(30);
    return rows.map(row => ({ ...row, actorName: row.actorName?.trim() || "Trader" }));
  }),

  unreadCount: protectedProcedure.query(async ({ ctx }) => {
    const db = await getDb();
    if (!db) databaseUnavailable();
    const rows = await db
      .select({ id: communityNotifications.id })
      .from(communityNotifications)
      .where(and(eq(communityNotifications.recipientId, ctx.user.id), isNull(communityNotifications.readAt)));
    return { count: rows.length };
  }),

  markAllRead: protectedProcedure.mutation(async ({ ctx }) => {
    const db = await getDb();
    if (!db) databaseUnavailable();
    await db
      .update(communityNotifications)
      .set({ readAt: new Date() })
      .where(and(eq(communityNotifications.recipientId, ctx.user.id), isNull(communityNotifications.readAt)));
    return { success: true };
  }),

  markRead: protectedProcedure.input(z.object({ notificationId: z.number().int().positive() })).mutation(async ({ ctx, input }) => {
    const db = await getDb();
    if (!db) databaseUnavailable();
    await db
      .update(communityNotifications)
      .set({ readAt: new Date() })
      .where(and(eq(communityNotifications.id, input.notificationId), eq(communityNotifications.recipientId, ctx.user.id)));
    return { success: true };
  }),
});
