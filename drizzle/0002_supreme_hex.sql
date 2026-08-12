CREATE TYPE "public"."community_reaction" AS ENUM('insightful', 'support', 'question');--> statement-breakpoint
CREATE TYPE "public"."trading_style" AS ENUM('scalper', 'day_trader', 'swing_trader', 'position_trader', 'options_trader', 'crypto_trader', 'forex_trader');--> statement-breakpoint
CREATE TABLE "community_comment_reactions" (
	"id" integer PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "community_comment_reactions_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 2147483647 START WITH 1 CACHE 1),
	"commentId" integer NOT NULL,
	"userId" integer NOT NULL,
	"reaction" "community_reaction" NOT NULL,
	"createdAt" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "community_post_attachments" (
	"id" integer PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "community_post_attachments_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 2147483647 START WITH 1 CACHE 1),
	"postId" integer NOT NULL,
	"authorId" integer NOT NULL,
	"storageKey" varchar(512) NOT NULL,
	"url" varchar(640) NOT NULL,
	"fileName" varchar(255) NOT NULL,
	"mimeType" varchar(100) NOT NULL,
	"byteSize" integer NOT NULL,
	"createdAt" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "community_post_reactions" (
	"id" integer PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "community_post_reactions_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 2147483647 START WITH 1 CACHE 1),
	"postId" integer NOT NULL,
	"userId" integer NOT NULL,
	"reaction" "community_reaction" NOT NULL,
	"createdAt" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "tradingStyle" "trading_style";--> statement-breakpoint
ALTER TABLE "community_comment_reactions" ADD CONSTRAINT "community_comment_reactions_commentId_community_comments_id_fk" FOREIGN KEY ("commentId") REFERENCES "public"."community_comments"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "community_comment_reactions" ADD CONSTRAINT "community_comment_reactions_userId_users_id_fk" FOREIGN KEY ("userId") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "community_post_attachments" ADD CONSTRAINT "community_post_attachments_postId_community_posts_id_fk" FOREIGN KEY ("postId") REFERENCES "public"."community_posts"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "community_post_attachments" ADD CONSTRAINT "community_post_attachments_authorId_users_id_fk" FOREIGN KEY ("authorId") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "community_post_reactions" ADD CONSTRAINT "community_post_reactions_postId_community_posts_id_fk" FOREIGN KEY ("postId") REFERENCES "public"."community_posts"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "community_post_reactions" ADD CONSTRAINT "community_post_reactions_userId_users_id_fk" FOREIGN KEY ("userId") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "community_comment_reactions_comment_idx" ON "community_comment_reactions" USING btree ("commentId");--> statement-breakpoint
CREATE INDEX "community_comment_reactions_user_comment_idx" ON "community_comment_reactions" USING btree ("userId","commentId");--> statement-breakpoint
CREATE INDEX "community_attachments_post_idx" ON "community_post_attachments" USING btree ("postId");--> statement-breakpoint
CREATE INDEX "community_attachments_author_idx" ON "community_post_attachments" USING btree ("authorId");--> statement-breakpoint
CREATE INDEX "community_post_reactions_post_idx" ON "community_post_reactions" USING btree ("postId");--> statement-breakpoint
CREATE INDEX "community_post_reactions_user_post_idx" ON "community_post_reactions" USING btree ("userId","postId");