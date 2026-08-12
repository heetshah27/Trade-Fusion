CREATE TYPE "public"."community_notification_type" AS ENUM('post_reply', 'post_reaction', 'comment_reaction');--> statement-breakpoint
CREATE TABLE "community_notifications" (
  "id" integer PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "community_notifications_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 2147483647 START WITH 1 CACHE 1),
  "recipientId" integer NOT NULL,
  "actorId" integer NOT NULL,
  "type" "community_notification_type" NOT NULL,
  "postId" integer NOT NULL,
  "commentId" integer,
  "reaction" "community_reaction",
  "readAt" timestamp with time zone,
  "createdAt" timestamp with time zone DEFAULT now() NOT NULL
);--> statement-breakpoint
ALTER TABLE "community_notifications" ADD CONSTRAINT "community_notifications_recipientId_users_id_fk" FOREIGN KEY ("recipientId") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "community_notifications" ADD CONSTRAINT "community_notifications_actorId_users_id_fk" FOREIGN KEY ("actorId") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "community_notifications" ADD CONSTRAINT "community_notifications_postId_community_posts_id_fk" FOREIGN KEY ("postId") REFERENCES "public"."community_posts"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "community_notifications" ADD CONSTRAINT "community_notifications_commentId_community_comments_id_fk" FOREIGN KEY ("commentId") REFERENCES "public"."community_comments"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "community_notifications_recipient_created_idx" ON "community_notifications" USING btree ("recipientId","createdAt");--> statement-breakpoint
CREATE INDEX "community_notifications_recipient_read_idx" ON "community_notifications" USING btree ("recipientId","readAt");
