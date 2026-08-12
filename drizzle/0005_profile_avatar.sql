ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "profileAvatarUrl" text;
ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "profileAvatarKey" text;
