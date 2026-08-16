import { boolean, decimal, index, integer, pgEnum, pgTable, text, timestamp, uniqueIndex, varchar } from "drizzle-orm/pg-core";

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
export const communityNotificationTypeEnum = pgEnum("community_notification_type", ["post_reply", "post_reaction", "comment_reaction"]);
export const tradingStyleEnum = pgEnum("trading_style", [
  "scalper",
  "day_trader",
  "swing_trader",
  "position_trader",
  "options_trader",
  "crypto_trader",
  "forex_trader",
]);
export const backtestSessionStatusEnum = pgEnum("backtest_session_status", ["active", "archived"]);
export const contactInquiryStatusEnum = pgEnum("contact_inquiry_status", ["new", "read", "resolved"]);

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
  profileAvatarUrl: text("profileAvatarUrl"),
  profileAvatarKey: text("profileAvatarKey"),
  createdAt: timestamp("createdAt", { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp("updatedAt", { withTimezone: true }).defaultNow().notNull(),
  lastSignedIn: timestamp("lastSignedIn", { withTimezone: true }).defaultNow().notNull(),
});

export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;

/** Public website inquiries; only the project owner can read these records. */
export const contactInquiries = pgTable(
  "contact_inquiries",
  {
    id: integer("id").primaryKey().generatedAlwaysAsIdentity(),
    name: varchar("name", { length: 80 }).notNull(),
    email: varchar("email", { length: 320 }).notNull(),
    message: text("message").notNull(),
    status: contactInquiryStatusEnum("status").default("new").notNull(),
    readAt: timestamp("readAt", { withTimezone: true }),
    createdAt: timestamp("createdAt", { withTimezone: true }).defaultNow().notNull(),
  },
  table => [
    index("contact_inquiries_status_created_idx").on(table.status, table.createdAt),
    index("contact_inquiries_created_idx").on(table.createdAt),
  ]
);

export type ContactInquiry = typeof contactInquiries.$inferSelect;

/** A member-owned setup library used by manual live-trade logging and analytics. */
export const tradeSetups = pgTable(
  "trade_setups",
  {
    id: integer("id").primaryKey().generatedAlwaysAsIdentity(),
    userId: integer("userId").notNull().references(() => users.id, { onDelete: "cascade" }),
    name: varchar("name", { length: 80 }).notNull(),
    slug: varchar("slug", { length: 96 }).notNull(),
    description: text("description"),
    color: varchar("color", { length: 16 }),
    isArchived: boolean("isArchived").default(false).notNull(),
    createdAt: timestamp("createdAt", { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp("updatedAt", { withTimezone: true }).defaultNow().notNull(),
  },
  table => [uniqueIndex("trade_setups_user_slug_idx").on(table.userId, table.slug), index("trade_setups_user_archived_idx").on(table.userId, table.isArchived)]
);

export type TradeSetup = typeof tradeSetups.$inferSelect;

/**
 * Trade journal entries — one row per trade logged by a user
 */
export const trades = pgTable(
  "trades",
  {
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
    setupId: integer("setupId").references(() => tradeSetups.id, { onDelete: "set null" }),
    setupTag: varchar("setupTag", { length: 80 }),
    marketSession: varchar("marketSession", { length: 24 }),
    instrumentCategory: varchar("instrumentCategory", { length: 24 }),
    tradeQuality: varchar("tradeQuality", { length: 16 }),
    ruleFollowed: boolean("ruleFollowed"),
    notes: text("notes"),
    createdAt: timestamp("createdAt", { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp("updatedAt", { withTimezone: true }).defaultNow().notNull(),
  },
  table => [index("trades_user_setup_tag_idx").on(table.userId, table.setupTag), index("trades_user_setup_id_idx").on(table.userId, table.setupId), index("trades_user_market_session_idx").on(table.userId, table.marketSession)]
);

export type Trade = typeof trades.$inferSelect;
export type InsertTrade = typeof trades.$inferInsert;

/**
 * Private written trading review linked to one member-owned live trade. These
 * records never feed analytics and are never shared to the Trader's Room.
 */
export const tradeJournalEntries = pgTable(
  "trade_journal_entries",
  {
    id: integer("id").primaryKey().generatedAlwaysAsIdentity(),
    userId: integer("userId").notNull().references(() => users.id, { onDelete: "cascade" }),
    tradeId: integer("tradeId").notNull().references(() => trades.id, { onDelete: "cascade" }),
    tradeIdea: text("tradeIdea"),
    marketContext: text("marketContext"),
    executionReview: text("executionReview"),
    reflection: text("reflection"),
    emotion: varchar("emotion", { length: 48 }),
    rating: integer("rating"),
    createdAt: timestamp("createdAt", { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp("updatedAt", { withTimezone: true }).defaultNow().notNull(),
  },
  table => [
    uniqueIndex("trade_journal_entries_user_trade_unique").on(table.userId, table.tradeId),
    index("trade_journal_entries_user_updated_idx").on(table.userId, table.updatedAt),
    index("trade_journal_entries_trade_idx").on(table.tradeId),
  ]
);

export type TradeJournalEntry = typeof tradeJournalEntries.$inferSelect;

/** Owner-only chart screenshots associated with a private live-trade Journal entry. */
export const tradeJournalAttachments = pgTable(
  "trade_journal_attachments",
  {
    id: integer("id").primaryKey().generatedAlwaysAsIdentity(),
    journalEntryId: integer("journalEntryId").notNull().references(() => tradeJournalEntries.id, { onDelete: "cascade" }),
    userId: integer("userId").notNull().references(() => users.id, { onDelete: "cascade" }),
    storageKey: varchar("storageKey", { length: 512 }).notNull(),
    url: varchar("url", { length: 640 }).notNull(),
    fileName: varchar("fileName", { length: 255 }).notNull(),
    mimeType: varchar("mimeType", { length: 100 }).notNull(),
    byteSize: integer("byteSize").notNull(),
    createdAt: timestamp("createdAt", { withTimezone: true }).defaultNow().notNull(),
  },
  table => [
    index("trade_journal_attachments_entry_created_idx").on(table.journalEntryId, table.createdAt),
    index("trade_journal_attachments_user_idx").on(table.userId),
  ]
);

export type TradeJournalAttachment = typeof tradeJournalAttachments.$inferSelect;

/**
 * Private strategy-testing sessions. These simulated records never feed live
 * journal statistics or are shared with the Trader’s Room automatically.
 */
export const backtestSessions = pgTable(
  "backtest_sessions",
  {
    id: integer("id").primaryKey().generatedAlwaysAsIdentity(),
    userId: integer("userId").notNull().references(() => users.id, { onDelete: "cascade" }),
    strategyName: varchar("strategyName", { length: 120 }).notNull(),
    symbol: varchar("symbol", { length: 20 }).notNull(),
    timeframe: varchar("timeframe", { length: 16 }).notNull(),
    startDate: varchar("startDate", { length: 10 }).notNull(),
    endDate: varchar("endDate", { length: 10 }).notNull(),
    initialBalance: decimal("initialBalance", { precision: 14, scale: 2 }).default("10000").notNull(),
    notes: text("notes"),
    status: backtestSessionStatusEnum("status").default("active").notNull(),
    createdAt: timestamp("createdAt", { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp("updatedAt", { withTimezone: true }).defaultNow().notNull(),
  },
  table => [
    index("backtest_sessions_user_created_idx").on(table.userId, table.createdAt),
    index("backtest_sessions_user_status_idx").on(table.userId, table.status),
  ]
);

/** Simulated entries belonging exclusively to a private backtest session. */
export const backtestTrades = pgTable(
  "backtest_trades",
  {
    id: integer("id").primaryKey().generatedAlwaysAsIdentity(),
    sessionId: integer("sessionId").notNull().references(() => backtestSessions.id, { onDelete: "cascade" }),
    userId: integer("userId").notNull().references(() => users.id, { onDelete: "cascade" }),
    date: varchar("date", { length: 10 }).notNull(),
    entryAt: timestamp("entryAt", { withTimezone: true }),
    exitAt: timestamp("exitAt", { withTimezone: true }),
    direction: directionEnum("direction").notNull(),
    entryPrice: decimal("entryPrice", { precision: 14, scale: 5 }).notNull(),
    exitPrice: decimal("exitPrice", { precision: 14, scale: 5 }).notNull(),
    quantity: decimal("quantity", { precision: 14, scale: 4 }).notNull(),
    stopLoss: decimal("stopLoss", { precision: 14, scale: 5 }),
    takeProfit: decimal("takeProfit", { precision: 14, scale: 5 }),
    takeProfitQuantity: decimal("takeProfitQuantity", { precision: 14, scale: 4 }),
    pnl: decimal("pnl", { precision: 14, scale: 2 }).notNull(),
    fees: decimal("fees", { precision: 14, scale: 2 }).default("0").notNull(),
    rMultiple: decimal("rMultiple", { precision: 10, scale: 2 }),
    setupTag: varchar("setupTag", { length: 80 }),
    notes: text("notes"),
    createdAt: timestamp("createdAt", { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp("updatedAt", { withTimezone: true }).defaultNow().notNull(),
  },
  table => [
    index("backtest_trades_session_date_idx").on(table.sessionId, table.date),
    index("backtest_trades_session_entry_at_idx").on(table.sessionId, table.entryAt),
    index("backtest_trades_user_idx").on(table.userId),
  ]
);

/** Private horizontal chart levels created by a member within a Backtest session. */
export const backtestAnnotations = pgTable(
  "backtest_annotations",
  {
    id: integer("id").primaryKey().generatedAlwaysAsIdentity(),
    sessionId: integer("sessionId").notNull().references(() => backtestSessions.id, { onDelete: "cascade" }),
    userId: integer("userId").notNull().references(() => users.id, { onDelete: "cascade" }),
    kind: varchar("kind", { length: 16 }).notNull(),
    price: decimal("price", { precision: 14, scale: 5 }).notNull(),
    endPrice: decimal("endPrice", { precision: 14, scale: 5 }),
    startAt: timestamp("startAt", { withTimezone: true }),
    endAt: timestamp("endAt", { withTimezone: true }),
    label: varchar("label", { length: 120 }),
    createdAt: timestamp("createdAt", { withTimezone: true }).defaultNow().notNull(),
  },
  table => [
    index("backtest_annotations_session_created_idx").on(table.sessionId, table.createdAt),
    index("backtest_annotations_user_idx").on(table.userId),
  ]
);

export type BacktestSession = typeof backtestSessions.$inferSelect;
export type BacktestTrade = typeof backtestTrades.$inferSelect;
export type BacktestAnnotation = typeof backtestAnnotations.$inferSelect;

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

/** Private in-app alerts for replies and reactions in Trader’s Room. */
export const communityNotifications = pgTable(
  "community_notifications",
  {
    id: integer("id").primaryKey().generatedAlwaysAsIdentity(),
    recipientId: integer("recipientId")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    actorId: integer("actorId")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    type: communityNotificationTypeEnum("type").notNull(),
    postId: integer("postId")
      .notNull()
      .references(() => communityPosts.id, { onDelete: "cascade" }),
    commentId: integer("commentId").references(() => communityComments.id, { onDelete: "cascade" }),
    reaction: communityReactionEnum("reaction"),
    readAt: timestamp("readAt", { withTimezone: true }),
    createdAt: timestamp("createdAt", { withTimezone: true }).defaultNow().notNull(),
  },
  table => [
    index("community_notifications_recipient_created_idx").on(table.recipientId, table.createdAt),
    index("community_notifications_recipient_read_idx").on(table.recipientId, table.readAt),
  ]
);

export type CommunityPost = typeof communityPosts.$inferSelect;
export type InsertCommunityPost = typeof communityPosts.$inferInsert;
export type CommunityComment = typeof communityComments.$inferSelect;
export type InsertCommunityComment = typeof communityComments.$inferInsert;
export type CommunityPostAttachment = typeof communityPostAttachments.$inferSelect;
export type CommunityPostReaction = typeof communityPostReactions.$inferSelect;
export type CommunityCommentReaction = typeof communityCommentReactions.$inferSelect;
export type CommunityNotification = typeof communityNotifications.$inferSelect;
