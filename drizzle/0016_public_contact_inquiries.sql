CREATE TYPE "contact_inquiry_status" AS ENUM ('new', 'read', 'resolved');
CREATE TABLE "contact_inquiries" (
  "id" integer GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  "name" varchar(80) NOT NULL,
  "email" varchar(320) NOT NULL,
  "message" text NOT NULL,
  "status" "contact_inquiry_status" NOT NULL DEFAULT 'new',
  "readAt" timestamp with time zone,
  "createdAt" timestamp with time zone NOT NULL DEFAULT now()
);
CREATE INDEX "contact_inquiries_status_created_idx" ON "contact_inquiries" ("status", "createdAt");
CREATE INDEX "contact_inquiries_created_idx" ON "contact_inquiries" ("createdAt");
