DROP INDEX "community_comment_reactions_user_comment_idx";--> statement-breakpoint
DROP INDEX "community_post_reactions_user_post_idx";--> statement-breakpoint
CREATE UNIQUE INDEX "community_comment_reactions_user_comment_unique" ON "community_comment_reactions" USING btree ("userId","commentId");--> statement-breakpoint
CREATE UNIQUE INDEX "community_post_reactions_user_post_unique" ON "community_post_reactions" USING btree ("userId","postId");