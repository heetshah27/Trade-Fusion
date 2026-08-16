CREATE TABLE "trade_journal_entries" (
  "id" integer GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  "userId" integer NOT NULL REFERENCES "users"("id") ON DELETE CASCADE,
  "tradeId" integer NOT NULL REFERENCES "trades"("id") ON DELETE CASCADE,
  "tradeIdea" text,
  "marketContext" text,
  "executionReview" text,
  "reflection" text,
  "emotion" varchar(48),
  "rating" integer,
  "createdAt" timestamp with time zone NOT NULL DEFAULT now(),
  "updatedAt" timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT "trade_journal_entries_rating_range" CHECK ("rating" IS NULL OR ("rating" >= 1 AND "rating" <= 5))
);
CREATE UNIQUE INDEX "trade_journal_entries_user_trade_unique" ON "trade_journal_entries" ("userId", "tradeId");
CREATE INDEX "trade_journal_entries_user_updated_idx" ON "trade_journal_entries" ("userId", "updatedAt");
CREATE INDEX "trade_journal_entries_trade_idx" ON "trade_journal_entries" ("tradeId");
