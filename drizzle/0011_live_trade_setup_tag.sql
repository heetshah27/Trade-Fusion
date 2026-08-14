ALTER TABLE "trades" ADD COLUMN IF NOT EXISTS "setupTag" varchar(80);
CREATE INDEX IF NOT EXISTS "trades_user_setup_tag_idx" ON "trades" ("userId", "setupTag");
