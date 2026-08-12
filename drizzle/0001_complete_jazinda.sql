CREATE TYPE "public"."community_category" AS ENUM('trade_ideas', 'execution_review', 'psychology', 'market_context');--> statement-breakpoint
CREATE TYPE "public"."community_content_status" AS ENUM('active', 'removed');--> statement-breakpoint
CREATE TYPE "public"."community_report_status" AS ENUM('open', 'reviewed');--> statement-breakpoint
CREATE TABLE "community_comments" (
	"id" integer PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "community_comments_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 2147483647 START WITH 1 CACHE 1),
	"postId" integer NOT NULL,
	"authorId" integer NOT NULL,
	"body" text NOT NULL,
	"status" "community_content_status" DEFAULT 'active' NOT NULL,
	"createdAt" timestamp with time zone DEFAULT now() NOT NULL,
	"updatedAt" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "community_post_reports" (
	"id" integer PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "community_post_reports_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 2147483647 START WITH 1 CACHE 1),
	"postId" integer NOT NULL,
	"reporterId" integer NOT NULL,
	"reason" varchar(500) NOT NULL,
	"status" "community_report_status" DEFAULT 'open' NOT NULL,
	"createdAt" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "community_posts" (
	"id" integer PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "community_posts_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 2147483647 START WITH 1 CACHE 1),
	"authorId" integer NOT NULL,
	"category" "community_category" NOT NULL,
	"title" varchar(140) NOT NULL,
	"body" text NOT NULL,
	"status" "community_content_status" DEFAULT 'active' NOT NULL,
	"createdAt" timestamp with time zone DEFAULT now() NOT NULL,
	"updatedAt" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "community_comments" ADD CONSTRAINT "community_comments_postId_community_posts_id_fk" FOREIGN KEY ("postId") REFERENCES "public"."community_posts"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "community_comments" ADD CONSTRAINT "community_comments_authorId_users_id_fk" FOREIGN KEY ("authorId") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "community_post_reports" ADD CONSTRAINT "community_post_reports_postId_community_posts_id_fk" FOREIGN KEY ("postId") REFERENCES "public"."community_posts"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "community_post_reports" ADD CONSTRAINT "community_post_reports_reporterId_users_id_fk" FOREIGN KEY ("reporterId") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "community_posts" ADD CONSTRAINT "community_posts_authorId_users_id_fk" FOREIGN KEY ("authorId") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "community_comments_post_created_idx" ON "community_comments" USING btree ("postId","createdAt");--> statement-breakpoint
CREATE INDEX "community_comments_author_idx" ON "community_comments" USING btree ("authorId");--> statement-breakpoint
CREATE INDEX "community_reports_post_idx" ON "community_post_reports" USING btree ("postId");--> statement-breakpoint
CREATE INDEX "community_reports_status_idx" ON "community_post_reports" USING btree ("status");--> statement-breakpoint
CREATE INDEX "community_posts_author_idx" ON "community_posts" USING btree ("authorId");--> statement-breakpoint
CREATE INDEX "community_posts_category_created_idx" ON "community_posts" USING btree ("category","createdAt");