import Stripe from "stripe";

const secretKey = process.env.STRIPE_SECRET_KEY || "";
const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET || "";

const result = {
  secretKeyPresent: Boolean(secretKey),
  secretKeyMode: secretKey.startsWith("sk_test_") ? "test" : secretKey.startsWith("sk_live_") ? "live" : secretKey ? "unrecognized" : "missing",
  webhookSecretPresent: Boolean(webhookSecret),
  apiReachable: false,
};

if (!secretKey) {
  console.log(JSON.stringify(result));
  process.exit(0);
}

try {
  const stripe = new Stripe(secretKey);
  const account = await stripe.accounts.retrieve();
  result.apiReachable = true;
  result.accountId = account.id;
  result.chargesEnabled = account.charges_enabled;
  result.detailsSubmitted = account.details_submitted;
  console.log(JSON.stringify(result));
} catch (error) {
  result.errorType = error?.type || error?.name || "unknown";
  result.errorMessage = error instanceof Error ? error.message : "Unknown Stripe API error";
  console.log(JSON.stringify(result));
}
