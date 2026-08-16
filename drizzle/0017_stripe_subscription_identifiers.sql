ALTER TABLE "users" ADD COLUMN "stripeCustomerId" varchar(255);
--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "stripeSubscriptionId" varchar(255);
--> statement-breakpoint
CREATE UNIQUE INDEX "users_stripe_customer_id_unique" ON "users" ("stripeCustomerId");
--> statement-breakpoint
CREATE UNIQUE INDEX "users_stripe_subscription_id_unique" ON "users" ("stripeSubscriptionId");
