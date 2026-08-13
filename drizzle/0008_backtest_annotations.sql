CREATE TABLE "backtest_annotations" (
  "id" integer GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  "sessionId" integer NOT NULL REFERENCES "backtest_sessions"("id") ON DELETE CASCADE,
  "userId" integer NOT NULL REFERENCES "users"("id") ON DELETE CASCADE,
  "kind" varchar(16) NOT NULL,
  "price" numeric(14,5) NOT NULL,
  "label" varchar(120),
  "createdAt" timestamp with time zone NOT NULL DEFAULT now()
);

CREATE INDEX "backtest_annotations_session_created_idx" ON "backtest_annotations" ("sessionId", "createdAt");
CREATE INDEX "backtest_annotations_user_idx" ON "backtest_annotations" ("userId");
