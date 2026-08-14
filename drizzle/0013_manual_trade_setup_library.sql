CREATE TABLE "trade_setups" (
  "id" integer GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  "userId" integer NOT NULL REFERENCES "users"("id") ON DELETE CASCADE,
  "name" varchar(80) NOT NULL,
  "slug" varchar(96) NOT NULL,
  "description" text,
  "color" varchar(16),
  "isArchived" boolean NOT NULL DEFAULT false,
  "createdAt" timestamp with time zone NOT NULL DEFAULT now(),
  "updatedAt" timestamp with time zone NOT NULL DEFAULT now()
);
CREATE UNIQUE INDEX "trade_setups_user_slug_idx" ON "trade_setups" ("userId", "slug");
CREATE INDEX "trade_setups_user_archived_idx" ON "trade_setups" ("userId", "isArchived");
ALTER TABLE "trades" ADD COLUMN "setupId" integer REFERENCES "trade_setups"("id") ON DELETE SET NULL;
ALTER TABLE "trades" ADD COLUMN "instrumentCategory" varchar(24);
ALTER TABLE "trades" ADD COLUMN "tradeQuality" varchar(16);
ALTER TABLE "trades" ADD COLUMN "ruleFollowed" boolean;
CREATE INDEX "trades_user_setup_id_idx" ON "trades" ("userId", "setupId");
