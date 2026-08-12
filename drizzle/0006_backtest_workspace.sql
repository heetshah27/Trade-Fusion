CREATE TYPE "public"."backtest_session_status" AS ENUM('active', 'archived');

CREATE TABLE "backtest_sessions" (
  "id" integer GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  "userId" integer NOT NULL REFERENCES "users"("id") ON DELETE CASCADE,
  "strategyName" varchar(120) NOT NULL,
  "symbol" varchar(20) NOT NULL,
  "timeframe" varchar(16) NOT NULL,
  "startDate" varchar(10) NOT NULL,
  "endDate" varchar(10) NOT NULL,
  "initialBalance" numeric(14,2) NOT NULL DEFAULT '10000',
  "notes" text,
  "status" "backtest_session_status" NOT NULL DEFAULT 'active',
  "createdAt" timestamp with time zone NOT NULL DEFAULT now(),
  "updatedAt" timestamp with time zone NOT NULL DEFAULT now()
);

CREATE INDEX "backtest_sessions_user_created_idx" ON "backtest_sessions" ("userId", "createdAt");
CREATE INDEX "backtest_sessions_user_status_idx" ON "backtest_sessions" ("userId", "status");

CREATE TABLE "backtest_trades" (
  "id" integer GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  "sessionId" integer NOT NULL REFERENCES "backtest_sessions"("id") ON DELETE CASCADE,
  "userId" integer NOT NULL REFERENCES "users"("id") ON DELETE CASCADE,
  "date" varchar(10) NOT NULL,
  "direction" "direction" NOT NULL,
  "entryPrice" numeric(14,5) NOT NULL,
  "exitPrice" numeric(14,5) NOT NULL,
  "quantity" numeric(14,4) NOT NULL,
  "stopLoss" numeric(14,5),
  "takeProfit" numeric(14,5),
  "pnl" numeric(14,2) NOT NULL,
  "fees" numeric(14,2) NOT NULL DEFAULT '0',
  "rMultiple" numeric(10,2),
  "setupTag" varchar(80),
  "notes" text,
  "createdAt" timestamp with time zone NOT NULL DEFAULT now(),
  "updatedAt" timestamp with time zone NOT NULL DEFAULT now()
);

CREATE INDEX "backtest_trades_session_date_idx" ON "backtest_trades" ("sessionId", "date");
CREATE INDEX "backtest_trades_user_idx" ON "backtest_trades" ("userId");
