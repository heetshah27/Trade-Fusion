CREATE TABLE IF NOT EXISTS "trading_account_preferences" (
  "userId" integer PRIMARY KEY NOT NULL,
  "lastActiveAccountId" integer,
  "updatedAt" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname IN ('trading_account_preferences_userId_users_id_fk', 'trading_account_preferences_user_fk')) THEN
    ALTER TABLE "trading_account_preferences"
      ADD CONSTRAINT "trading_account_preferences_user_fk"
      FOREIGN KEY ("userId") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname IN ('trading_account_preferences_lastActiveAccountId_trading_account', 'trading_account_preferences_account_fk')) THEN
    ALTER TABLE "trading_account_preferences"
      ADD CONSTRAINT "trading_account_preferences_account_fk"
      FOREIGN KEY ("lastActiveAccountId") REFERENCES "public"."trading_accounts"("id") ON DELETE set null ON UPDATE no action;
  END IF;
END $$;
