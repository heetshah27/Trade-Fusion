ALTER TABLE "backtest_trades" ADD COLUMN IF NOT EXISTS "entryAt" timestamp with time zone;
ALTER TABLE "backtest_trades" ADD COLUMN IF NOT EXISTS "exitAt" timestamp with time zone;
CREATE INDEX IF NOT EXISTS "backtest_trades_session_entry_at_idx" ON "backtest_trades" ("sessionId", "entryAt");
