DO $$ BEGIN
  CREATE TYPE "trading_account_type" AS ENUM ('none', 'personal_funds', 'live_funded', 'challenge_phase_1', 'challenge_phase_2', 'demo');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

CREATE TABLE IF NOT EXISTS "trading_accounts" (
  "id" integer GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  "userId" integer NOT NULL REFERENCES "users"("id") ON DELETE CASCADE,
  "name" varchar(80) NOT NULL,
  "initialBalance" numeric(14, 2) NOT NULL,
  "currentBalance" numeric(14, 2) NOT NULL,
  "accountType" "trading_account_type" NOT NULL DEFAULT 'none',
  "createdAt" timestamp with time zone NOT NULL DEFAULT now(),
  "updatedAt" timestamp with time zone NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS "trading_accounts_user_updated_idx" ON "trading_accounts" ("userId", "updatedAt");
ALTER TABLE "trades" ADD COLUMN IF NOT EXISTS "accountId" integer;

DO $$ BEGIN
  ALTER TABLE "trades"
    ADD CONSTRAINT "trades_accountId_trading_accounts_id_fk"
    FOREIGN KEY ("accountId") REFERENCES "trading_accounts"("id") ON DELETE SET NULL;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

CREATE INDEX IF NOT EXISTS "trades_user_account_idx" ON "trades" ("userId", "accountId");
