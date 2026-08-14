ALTER TABLE "trades" ADD COLUMN IF NOT EXISTS "marketSession" varchar(24);
CREATE INDEX IF NOT EXISTS "trades_user_market_session_idx" ON "trades" ("userId", "marketSession");
