import { TRPCError } from "@trpc/server";
import { and, desc, eq, inArray } from "drizzle-orm";
import { z } from "zod";
import {
  communityComments,
  communityPostReports,
  communityPosts,
  users,
} from "../drizzle/schema";
import { getDb } from "./db";
import { protectedProcedure, router } from "./_core/trpc";

const communityCategories = [
  "trade_ideas",
  "execution_review",
  "psychology",
  "market_context",
] as const;

const createPostSchema = z.object({
  category: z.enum(communityCategories),
  title: z.string().trim().min(4).max(140),
  body: z.string().trim().min(12).max(5000),
});

const commentSchema = z.object({
  postId: z.number().int().positive(),
  body: z.string().trim().min(2).max(2000),
});

const reportSchema = z.object({
  postId: z.number().int().positive(),
  reason: z.string().trim().min(4).max(500),
});

function databaseUnavailable() {
  return new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Community database unavailable" });
}

function displayName(name: string | null) {
  return name?.trim() || "Trader";
}

export function canModerateCommunity(role: "user" | "admin") {
  return role === "admin";
}

export function canDeleteCommunityPost(authorId: number, currentUserId: number, role: "user" | "admin") {
  return authorId === currentUserId || canModerateCommunity(role);
}

export const communityRouter = router({
  list: protectedProcedure.query(async ({ ctx }) => {
    const db = await getDb();
    if (!db) throw databaseUnavailable();

    const posts = await db
      .select({
        id: communityPosts.id,
        authorId: communityPosts.authorId,
        category: communityPosts.category,
        title: communityPosts.title,
        body: communityPosts.body,
        createdAt: communityPosts.createdAt,
        updatedAt: communityPosts.updatedAt,
        authorName: users.name,
      })
      .from(communityPosts)
      .innerJoin(users, eq(communityPosts.authorId, users.id))
      .where(eq(communityPosts.status, "active"))
      .orderBy(desc(communityPosts.createdAt));

    const postIds = posts.map(post => post.id);
    const comments = postIds.length
      ? await db
          .select({
            id: communityComments.id,
            postId: communityComments.postId,
            authorId: communityComments.authorId,
            body: communityComments.body,
            createdAt: communityComments.createdAt,
            authorName: users.name,
          })
          .from(communityComments)
          .innerJoin(users, eq(communityComments.authorId, users.id))
          .where(
            and(
              inArray(communityComments.postId, postIds),
              eq(communityComments.status, "active")
            )
          )
          .orderBy(communityComments.createdAt)
      : [];

    return posts.map(post => ({
      ...post,
      authorName: displayName(post.authorName),
      isOwner: post.authorId === ctx.user.id,
      comments: comments
        .filter(comment => comment.postId === post.id)
        .map(comment => ({
          ...comment,
          authorName: displayName(comment.authorName),
          isOwner: comment.authorId === ctx.user.id,
        })),
    }));
  }),

  createPost: protectedProcedure.input(createPostSchema).mutation(async ({ ctx, input }) => {
    const db = await getDb();
    if (!db) throw databaseUnavailable();

    const [post] = await db
      .insert(communityPosts)
      .values({
        authorId: ctx.user.id,
        category: input.category,
        title: input.title,
        body: input.body,
      })
      .returning();

    return post;
  }),

  addComment: protectedProcedure.input(commentSchema).mutation(async ({ ctx, input }) => {
    const db = await getDb();
    if (!db) throw databaseUnavailable();

    const [post] = await db
      .select({ id: communityPosts.id })
      .from(communityPosts)
      .where(and(eq(communityPosts.id, input.postId), eq(communityPosts.status, "active")));

    if (!post) throw new TRPCError({ code: "NOT_FOUND", message: "Discussion not found" });

    const [comment] = await db
      .insert(communityComments)
      .values({ postId: input.postId, authorId: ctx.user.id, body: input.body })
      .returning();

    return comment;
  }),

  reportPost: protectedProcedure.input(reportSchema).mutation(async ({ ctx, input }) => {
    const db = await getDb();
    if (!db) throw databaseUnavailable();

    const [post] = await db
      .select({ id: communityPosts.id })
      .from(communityPosts)
      .where(and(eq(communityPosts.id, input.postId), eq(communityPosts.status, "active")));
    if (!post) throw new TRPCError({ code: "NOT_FOUND", message: "Discussion not found" });

    const existing = await db
      .select({ id: communityPostReports.id })
      .from(communityPostReports)
      .where(
        and(
          eq(communityPostReports.postId, input.postId),
          eq(communityPostReports.reporterId, ctx.user.id)
        )
      )
      .limit(1);

    if (existing.length > 0) return { success: true, alreadyReported: true };

    await db
      .insert(communityPostReports)
      .values({ postId: input.postId, reporterId: ctx.user.id, reason: input.reason });
    return { success: true, alreadyReported: false };
  }),

  removePost: protectedProcedure
    .input(z.object({ postId: z.number().int().positive() }))
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw databaseUnavailable();

      const [post] = await db
        .select({ authorId: communityPosts.authorId })
        .from(communityPosts)
        .where(eq(communityPosts.id, input.postId));
      if (!post) throw new TRPCError({ code: "NOT_FOUND", message: "Discussion not found" });
      if (!canDeleteCommunityPost(post.authorId, ctx.user.id, ctx.user.role)) {
        throw new TRPCError({ code: "FORBIDDEN", message: "You cannot remove this discussion" });
      }

      await db
        .update(communityPosts)
        .set({ status: "removed", updatedAt: new Date() })
        .where(eq(communityPosts.id, input.postId));
      return { success: true };
    }),

  moderation: router({
    listOpenReports: protectedProcedure.query(async ({ ctx }) => {
      if (!canModerateCommunity(ctx.user.role)) {
        throw new TRPCError({ code: "FORBIDDEN", message: "Moderator access required" });
      }
      const db = await getDb();
      if (!db) throw databaseUnavailable();

      return db
        .select({
          id: communityPostReports.id,
          postId: communityPostReports.postId,
          reason: communityPostReports.reason,
          createdAt: communityPostReports.createdAt,
          postTitle: communityPosts.title,
          reporterName: users.name,
        })
        .from(communityPostReports)
        .innerJoin(communityPosts, eq(communityPostReports.postId, communityPosts.id))
        .innerJoin(users, eq(communityPostReports.reporterId, users.id))
        .where(eq(communityPostReports.status, "open"))
        .orderBy(desc(communityPostReports.createdAt));
    }),

    resolveReport: protectedProcedure
      .input(z.object({ reportId: z.number().int().positive(), action: z.enum(["dismiss", "remove_post"]) }))
      .mutation(async ({ ctx, input }) => {
        if (!canModerateCommunity(ctx.user.role)) {
          throw new TRPCError({ code: "FORBIDDEN", message: "Moderator access required" });
        }
        const db = await getDb();
        if (!db) throw databaseUnavailable();

        const [report] = await db
          .select({ id: communityPostReports.id, postId: communityPostReports.postId })
          .from(communityPostReports)
          .where(and(eq(communityPostReports.id, input.reportId), eq(communityPostReports.status, "open")));
        if (!report) throw new TRPCError({ code: "NOT_FOUND", message: "Open report not found" });

        if (input.action === "remove_post") {
          await db
            .update(communityPosts)
            .set({ status: "removed", updatedAt: new Date() })
            .where(eq(communityPosts.id, report.postId));
        }

        await db
          .update(communityPostReports)
          .set({ status: "reviewed" })
          .where(eq(communityPostReports.id, report.id));

        return { success: true };
      }),
  }),
});
