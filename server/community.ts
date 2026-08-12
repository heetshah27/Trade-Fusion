import { TRPCError } from "@trpc/server";
import { and, desc, eq, inArray, sql } from "drizzle-orm";
import { z } from "zod";
import {
  communityCommentReactions,
  communityComments,
  communityPostAttachments,
  communityPostReactions,
  communityPostReports,
  communityPosts,
  users,
} from "../drizzle/schema";
import {
  COMMUNITY_ATTACHMENT_RULES,
  COMMUNITY_REACTIONS,
  TRADING_STYLES,
  type CommunityReaction,
} from "../shared/communityConfig";
import { getDb } from "./db";
import { ENV } from "./_core/env";
import { protectedProcedure, router } from "./_core/trpc";
import { storagePut } from "./storage";
import { createCommunityNotification } from "./notifications";

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

const reactionSchema = z.enum(COMMUNITY_REACTIONS);
const attachmentSchema = z.object({
  postId: z.number().int().positive(),
  fileName: z.string().trim().min(1).max(255),
  mimeType: z.enum(COMMUNITY_ATTACHMENT_RULES.acceptedMimeTypes),
  dataUrl: z.string().min(32).max(Math.ceil(COMMUNITY_ATTACHMENT_RULES.maxBytesPerFile * 1.4) + 256),
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

export function canAttachToCommunityPost(postAuthorId: number, currentUserId: number) {
  return postAuthorId === currentUserId;
}

export function isCommunityFounder(authorOpenId: string, projectOwnerOpenId: string) {
  return Boolean(projectOwnerOpenId) && authorOpenId === projectOwnerOpenId;
}

export function toPublicCommunityAuthor<T extends { authorOpenId: string }>(author: T, projectOwnerOpenId: string) {
  const { authorOpenId, ...publicAuthor } = author;
  return { ...publicAuthor, isFounder: isCommunityFounder(authorOpenId, projectOwnerOpenId) };
}

export function reactionMutationAction(currentReaction: CommunityReaction | null | undefined, nextReaction: CommunityReaction) {
  return currentReaction === nextReaction ? "remove" : "upsert";
}

function summarizeReactions(
  reactions: Array<{ reaction: CommunityReaction; userId: number }>,
  currentUserId: number
) {
  const counts = Object.fromEntries(COMMUNITY_REACTIONS.map(reaction => [reaction, 0])) as Record<CommunityReaction, number>;
  let viewerReaction: CommunityReaction | null = null;
  for (const item of reactions) {
    counts[item.reaction] += 1;
    if (item.userId === currentUserId) viewerReaction = item.reaction;
  }
  return { counts, viewerReaction };
}

export function decodeImageDataUrl(dataUrl: string, expectedMimeType: string) {
  const match = dataUrl.match(/^data:([^;]+);base64,([A-Za-z0-9+/=]+)$/);
  if (!match || match[1] !== expectedMimeType) {
    throw new TRPCError({ code: "BAD_REQUEST", message: "Attachment must be a valid image data URL" });
  }
  const bytes = Buffer.from(match[2], "base64");
  if (bytes.length === 0 || bytes.length > COMMUNITY_ATTACHMENT_RULES.maxBytesPerFile) {
    throw new TRPCError({ code: "PAYLOAD_TOO_LARGE", message: "Image exceeds the 3 MB attachment limit" });
  }
  return bytes;
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
        authorOpenId: users.openId,
        authorTradingStyle: users.tradingStyle,
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
            authorOpenId: users.openId,
            authorTradingStyle: users.tradingStyle,
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

    const commentIds = comments.map(comment => comment.id);
    const [attachments, postReactions, commentReactions] = await Promise.all([
      postIds.length
        ? db
            .select()
            .from(communityPostAttachments)
            .where(inArray(communityPostAttachments.postId, postIds))
            .orderBy(communityPostAttachments.createdAt)
        : [],
      postIds.length
        ? db
            .select({ postId: communityPostReactions.postId, userId: communityPostReactions.userId, reaction: communityPostReactions.reaction })
            .from(communityPostReactions)
            .where(inArray(communityPostReactions.postId, postIds))
        : [],
      commentIds.length
        ? db
            .select({ commentId: communityCommentReactions.commentId, userId: communityCommentReactions.userId, reaction: communityCommentReactions.reaction })
            .from(communityCommentReactions)
            .where(inArray(communityCommentReactions.commentId, commentIds))
        : [],
    ]);

    return posts.map(post => {
      const publicPost = toPublicCommunityAuthor(post, ENV.ownerOpenId);
      return {
      ...publicPost,
      authorName: displayName(publicPost.authorName),
      isOwner: publicPost.authorId === ctx.user.id,
      attachments: attachments.filter(attachment => attachment.postId === post.id),
      reactions: summarizeReactions(postReactions.filter(reaction => reaction.postId === post.id), ctx.user.id),
      comments: comments
        .filter(comment => comment.postId === post.id)
        .map(comment => {
          const publicComment = toPublicCommunityAuthor(comment, ENV.ownerOpenId);
          return {
          ...publicComment,
          authorName: displayName(publicComment.authorName),
          isOwner: publicComment.authorId === ctx.user.id,
          reactions: summarizeReactions(commentReactions.filter(reaction => reaction.commentId === comment.id), ctx.user.id),
        };
        }),
    };
    });
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
      .select({ id: communityPosts.id, authorId: communityPosts.authorId })
     .from(communityPosts)
     .where(and(eq(communityPosts.id, input.postId), eq(communityPosts.status, "active")));

    if (!post) throw new TRPCError({ code: "NOT_FOUND", message: "Discussion not found" });

   const [comment] = await db
     .insert(communityComments)
     .values({ postId: input.postId, authorId: ctx.user.id, body: input.body })
     .returning();

    await createCommunityNotification(db, {
      recipientId: post.authorId,
      actorId: ctx.user.id,
      type: "post_reply",
      postId: input.postId,
      commentId: comment.id,
    });

   return comment;
  }),

  uploadAttachment: protectedProcedure.input(attachmentSchema).mutation(async ({ ctx, input }) => {
    const db = await getDb();
    if (!db) throw databaseUnavailable();

    const [post] = await db
      .select({ authorId: communityPosts.authorId, status: communityPosts.status })
      .from(communityPosts)
      .where(eq(communityPosts.id, input.postId));
    if (!post || post.status !== "active") {
      throw new TRPCError({ code: "NOT_FOUND", message: "Discussion not found" });
    }
    if (!canAttachToCommunityPost(post.authorId, ctx.user.id)) {
      throw new TRPCError({ code: "FORBIDDEN", message: "Only the discussion author can add attachments" });
    }

    const bytes = decodeImageDataUrl(input.dataUrl, input.mimeType);
    const extension = input.mimeType === "image/jpeg" ? "jpg" : input.mimeType.split("/")[1];
    const attachment = await db.transaction(async tx => {
      await tx.execute(sql`select pg_advisory_xact_lock(${input.postId})`);
      const existing = await tx
        .select({ id: communityPostAttachments.id })
        .from(communityPostAttachments)
        .where(eq(communityPostAttachments.postId, input.postId));
      if (existing.length >= COMMUNITY_ATTACHMENT_RULES.maxFilesPerPost) {
        throw new TRPCError({ code: "BAD_REQUEST", message: "A discussion can include up to two images" });
      }
      const uploaded = await storagePut(
        `community/${ctx.user.id}/posts/${input.postId}/${crypto.randomUUID()}.${extension}`,
        bytes,
        input.mimeType
      );
      const [created] = await tx
        .insert(communityPostAttachments)
        .values({
          postId: input.postId,
          authorId: ctx.user.id,
          storageKey: uploaded.key,
          url: uploaded.url,
          fileName: input.fileName,
          mimeType: input.mimeType,
          byteSize: bytes.length,
        })
        .returning();
      return created;
    });
    return attachment;
  }),

  removeAttachment: protectedProcedure
    .input(z.object({ attachmentId: z.number().int().positive() }))
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw databaseUnavailable();
      const [attachment] = await db
        .select({ id: communityPostAttachments.id, authorId: communityPostAttachments.authorId })
        .from(communityPostAttachments)
        .where(eq(communityPostAttachments.id, input.attachmentId));
      if (!attachment) throw new TRPCError({ code: "NOT_FOUND", message: "Attachment not found" });
      if (attachment.authorId !== ctx.user.id) {
        throw new TRPCError({ code: "FORBIDDEN", message: "Only the attachment owner can remove it" });
      }
      await db.delete(communityPostAttachments).where(eq(communityPostAttachments.id, attachment.id));
      return { success: true };
    }),

 reactToPost: protectedProcedure
   .input(z.object({ postId: z.number().int().positive(), reaction: reactionSchema }))
   .mutation(async ({ ctx, input }) => {
     const db = await getDb();
     if (!db) throw databaseUnavailable();
     const [post] = await db
        .select({ id: communityPosts.id, authorId: communityPosts.authorId })
       .from(communityPosts)
       .where(and(eq(communityPosts.id, input.postId), eq(communityPosts.status, "active")));
      if (!post) throw new TRPCError({ code: "NOT_FOUND", message: "Discussion not found" });

      const [existing] = await db
        .select({ id: communityPostReactions.id, reaction: communityPostReactions.reaction })
        .from(communityPostReactions)
        .where(and(eq(communityPostReactions.postId, input.postId), eq(communityPostReactions.userId, ctx.user.id)));
      if (reactionMutationAction(existing?.reaction, input.reaction) === "remove") {
        await db.delete(communityPostReactions).where(eq(communityPostReactions.id, existing.id));
        return { reaction: null };
      }
     await db
       .insert(communityPostReactions)
       .values({ postId: input.postId, userId: ctx.user.id, reaction: input.reaction })
       .onConflictDoUpdate({
         target: [communityPostReactions.userId, communityPostReactions.postId],
         set: { reaction: input.reaction },
       });
      await createCommunityNotification(db, {
        recipientId: post.authorId,
        actorId: ctx.user.id,
        type: "post_reaction",
        postId: input.postId,
        reaction: input.reaction,
      });
     return { reaction: input.reaction };
    }),

 reactToComment: protectedProcedure
   .input(z.object({ commentId: z.number().int().positive(), reaction: reactionSchema }))
   .mutation(async ({ ctx, input }) => {
     const db = await getDb();
     if (!db) throw databaseUnavailable();
     const [comment] = await db
        .select({ id: communityComments.id, authorId: communityComments.authorId, postId: communityComments.postId })
       .from(communityComments)
       .where(and(eq(communityComments.id, input.commentId), eq(communityComments.status, "active")));
      if (!comment) throw new TRPCError({ code: "NOT_FOUND", message: "Reply not found" });

      const [existing] = await db
        .select({ id: communityCommentReactions.id, reaction: communityCommentReactions.reaction })
        .from(communityCommentReactions)
        .where(and(eq(communityCommentReactions.commentId, input.commentId), eq(communityCommentReactions.userId, ctx.user.id)));
      if (reactionMutationAction(existing?.reaction, input.reaction) === "remove") {
        await db.delete(communityCommentReactions).where(eq(communityCommentReactions.id, existing.id));
        return { reaction: null };
      }
     await db
       .insert(communityCommentReactions)
       .values({ commentId: input.commentId, userId: ctx.user.id, reaction: input.reaction })
       .onConflictDoUpdate({
         target: [communityCommentReactions.userId, communityCommentReactions.commentId],
         set: { reaction: input.reaction },
       });
      await createCommunityNotification(db, {
        recipientId: comment.authorId,
        actorId: ctx.user.id,
        type: "comment_reaction",
        postId: comment.postId,
        commentId: comment.id,
        reaction: input.reaction,
      });
     return { reaction: input.reaction };
    }),

  profile: router({
    get: protectedProcedure.query(({ ctx }) => ({
      tradingStyle: ctx.user.tradingStyle,
      isFounder: isCommunityFounder(ctx.user.openId, ENV.ownerOpenId),
    })),
    setTradingStyle: protectedProcedure
      .input(z.object({ tradingStyle: z.enum(TRADING_STYLES).nullable() }))
      .mutation(async ({ ctx, input }) => {
        const db = await getDb();
        if (!db) throw databaseUnavailable();
        await db.update(users).set({ tradingStyle: input.tradingStyle }).where(eq(users.id, ctx.user.id));
        return { tradingStyle: input.tradingStyle };
      }),
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
