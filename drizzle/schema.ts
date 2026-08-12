import { decimal, index, integer, pgEnum, pgTable, text, timestamp, uniqueIndex, varchar } from "drizzle-orm/pg-core";

/**
 * Core user table backing auth flow.
 * Extend this file with additional tables as your product grows.
 * Columns use camelCase to match both database fields and generated types.
 */

// Enums for PostgreSQL
export const roleEnum = pgEnum("role", ["user", "admin"]);
export const directionEnum = pgEnum("direction", ["LONG", "SHORT"]);
export const communityCategoryEnum = pgEnum("community_category", [
  "trade_ideas",
  "execution_review",
  "psychology",
  "market_context",
]);
export const communityContentStatusEnum = pgEnum("community_content_status", ["active", "removed"]);
export const communityReportStatusEnum = pgEnum("community_report_status", ["open", "reviewed"]);
export const communityReactionEnum = pgEnum("community_reaction", ["insightful", "support", "question"]);
export const tradingStyleEnum = pgEnum("trading_style", [
  "scalper",
  "day_trader",
  "swing_trader",
  "position_trader",
  "options_trader",
  "crypto_trader",
  "forex_trader",
]);

export const users = pgTable("users", {
  /**
   * Surrogate primary key. Auto-incremented numeric value managed by the database.
   * Use this for relations between tables.
   */
  id: integer("id").primaryKey().generatedAlwaysAsIdentity(),
  /** Manus OAuth identifier (openId) returned from the OAuth callback. Unique per user. */
  openId: varchar("openId", { length: 64 }).notNull().unique(),
  name: text("name"),
  email: varchar("email", { length: 320 }),
  loginMethod: varchar("loginMethod", { length: 64 }),
  role: roleEnum("role").default("user").notNull(),
  tradingStyle: tradingStyleEnum("tradingStyle"),
  createdAt: timestamp("createdAt", { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp("updatedAt", { withTimezone: true }).defaultNow().notNull(),
  lastSignedIn: timestamp("lastSignedIn", { withTimezone: true }).defaultNow().notNull(),
});

export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;

/**
 * Trade journal entries — one row per trade logged by a user
 */
export const trades = pgTable("trades", {
  id: integer("id").primaryKey().generatedAlwaysAsIdentity(),
  userId: integer("userId").notNull().references(() => users.id, { onDelete: "cascade" }),
  date: varchar("date", { length: 10 }).notNull(), // YYYY-MM-DD
  symbol: varchar("symbol", { length: 20 }).notNull(),
  direction: directionEnum("direction").notNull(),
  entryPrice: decimal("entryPrice", { precision: 12, scale: 4 }).notNull(),
  exitPrice: decimal("exitPrice", { precision: 12, scale: 4 }).notNull(),
  quantity: decimal("quantity", { precision: 12, scale: 4 }).notNull(),
  pnl: decimal("pnl", { precision: 12, scale: 2 }).notNull(),
  fees: decimal("fees", { precision: 12, scale: 2 }).default("0").notNull(),
  notes: text("notes"),
  createdAt: timestamp("createdAt", { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp("updatedAt", { withTimezone: true }).defaultNow().notNull(),
});

export type Trade = typeof trades.$inferSelect;
export type InsertTrade = typeof trades.$inferInsert;

/**
 * Trader’s Room posts. Trade journal data is never copied here automatically;
 * members decide what information to share in their discussion text.
 */
export const communityPosts = pgTable(
  "community_posts",
  {
    id: integer("id").primaryKey().generatedAlwaysAsIdentity(),
    authorId: integer("authorId")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    category: communityCategoryEnum("category").notNull(),
    title: varchar("title", { length: 140 }).notNull(),
    body: text("body").notNull(),
    status: communityContentStatusEnum("status").default("active").notNull(),
    createdAt: timestamp("createdAt", { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp("updatedAt", { withTimezone: true }).defaultNow().notNull(),
  },
  table => [
    index("community_posts_author_idx").on(table.authorId),
    index("community_posts_category_created_idx").on(table.category, table.createdAt),
  ]
);

export const communityComments = pgTable(
  "community_comments",
  {
    id: integer("id").primaryKey().generatedAlwaysAsIdentity(),
    postId: integer("postId")
      .notNull()
      .references(() => communityPosts.id, { onDelete: "cascade" }),
    authorId: integer("authorId")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    body: text("body").notNull(),
    status: communityContentStatusEnum("status").default("active").notNull(),
    createdAt: timestamp("createdAt", { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp("updatedAt", { withTimezone: true }).defaultNow().notNull(),
  },
  table => [
    index("community_comments_post_created_idx").on(table.postId, table.createdAt),
    index("community_comments_author_idx").on(table.authorId),
  ]
);

/** Member reports are visible only to moderators through protected procedures. */
export const communityPostReports = pgTable(
  "community_post_reports",
  {
    id: integer("id").primaryKey().generatedAlwaysAsIdentity(),
    postId: integer("postId")
      .notNull()
      .references(() => communityPosts.id, { onDelete: "cascade" }),
    reporterId: integer("reporterId")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    reason: varchar("reason", { length: 500 }).notNull(),
    status: communityReportStatusEnum("status").default("open").notNull(),
    createdAt: timestamp("createdAt", { withTimezone: true }).defaultNow().notNull(),
  },
  table => [
    index("community_reports_post_idx").on(table.postId),
    index("community_reports_status_idx").on(table.status),
  ]
);

/** Images and chart captures are stored in S3; this table contains metadata only. */
export const communityPostAttachments = pgTable(
  "community_post_attachments",
  {
    id: integer("id").primaryKey().generatedAlwaysAsIdentity(),
    postId: integer("postId")
      .notNull()
      .references(() => communityPosts.id, { onDelete: "cascade" }),
    authorId: integer("authorId")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    storageKey: varchar("storageKey", { length: 512 }).notNull(),
    url: varchar("url", { length: 640 }).notNull(),
    fileName: varchar("fileName", { length: 255 }).notNull(),
    mimeType: varchar("mimeType", { length: 100 }).notNull(),
    byteSize: integer("byteSize").notNull(),
    createdAt: timestamp("createdAt", { withTimezone: true }).defaultNow().notNull(),
  },
  table => [
    index("community_attachments_post_idx").on(table.postId),
    index("community_attachments_author_idx").on(table.authorId),
  ]
);

/** One reaction of each target type per member; a subsequent choice replaces the prior one. */
export const communityPostReactions = pgTable(
  "community_post_reactions",
  {
    id: integer("id").primaryKey().generatedAlwaysAsIdentity(),
    postId: integer("postId")
      .notNull()
      .references(() => communityPosts.id, { onDelete: "cascade" }),
    userId: integer("userId")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    reaction: communityReactionEnum("reaction").notNull(),
    createdAt: timestamp("createdAt", { withTimezone: true }).defaultNow().notNull(),
  },
  table => [
    index("community_post_reactions_post_idx").on(table.postId),
    uniqueIndex("community_post_reactions_user_post_unique").on(table.userId, table.postId),
  ]
);

export const communityCommentReactions = pgTable(
  "community_comment_reactions",
  {
    id: integer("id").primaryKey().generatedAlwaysAsIdentity(),
    commentId: integer("commentId")
      .notNull()
      .references(() => communityComments.id, { onDelete: "cascade" }),
    userId: integer("userId")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    reaction: communityReactionEnum("reaction").notNull(),
    createdAt: timestamp("createdAt", { withTimezone: true }).defaultNow().notNull(),
  },
  table => [
    index("community_comment_reactions_comment_idx").on(table.commentId),
    uniqueIndex("community_comment_reactions_user_comment_unique").on(table.userId, table.commentId),
  ]
);

export type CommunityPost = typeof communityPosts.$inferSelect;
export type InsertCommunityPost = typeof communityPosts.$inferInsert;
export type CommunityComment = typeof communityComments.$inferSelect;
export type InsertCommunityComment = typeof communityComments.$inferInsert;
export type CommunityPostAttachment = typeof communityPostAttachments.$inferSelect;
export type CommunityPostReaction = typeof communityPostReactions.$inferSelect;
export type CommunityCommentReaction = typeof communityCommentReactions.$inferSelect;
