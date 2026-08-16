CREATE TABLE "trade_journal_attachments" (
  "id" integer GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  "journalEntryId" integer NOT NULL REFERENCES "trade_journal_entries"("id") ON DELETE CASCADE,
  "userId" integer NOT NULL REFERENCES "users"("id") ON DELETE CASCADE,
  "storageKey" varchar(512) NOT NULL,
  "url" varchar(640) NOT NULL,
  "fileName" varchar(255) NOT NULL,
  "mimeType" varchar(100) NOT NULL,
  "byteSize" integer NOT NULL,
  "createdAt" timestamp with time zone NOT NULL DEFAULT now()
);
CREATE INDEX "trade_journal_attachments_entry_created_idx" ON "trade_journal_attachments" ("journalEntryId", "createdAt");
CREATE INDEX "trade_journal_attachments_user_idx" ON "trade_journal_attachments" ("userId");
