CREATE TABLE IF NOT EXISTS "calendar_cache" (
  "key" varchar(64) PRIMARY KEY NOT NULL,
  "payload" jsonb NOT NULL,
  "refreshedAt" timestamp with time zone NOT NULL,
  "updatedAt" timestamp with time zone DEFAULT now() NOT NULL
);
