import type { Express, Request, Response } from "express";
import express from "express";
import Stripe from "stripe";
import { TRADE_FUSION_PRO } from "./products";
import { getUserById, getUserByStripeCustomerId, updateStripeReferences } from "./db";
import { clearMembershipCache } from "./membership";

let stripeClient: Stripe | null = null;
let proPriceIdPromise: Promise<string> | null = null;

export function isStripeConfigured() {
  return Boolean(process.env.STRIPE_SECRET_KEY && process.env.STRIPE_WEBHOOK_SECRET);
}

export function getStripeClient() {
  if (!process.env.STRIPE_SECRET_KEY) throw new Error("Stripe is not configured");
  stripeClient ??= new Stripe(process.env.STRIPE_SECRET_KEY);
  return stripeClient;
}

function stripeId(value: string | { id: string } | null | undefined) {
  if (!value) return null;
  return typeof value === "string" ? value : value.id;
}

function billingOrigin(req: Request) {
  const candidate = typeof req.headers.origin === "string" ? req.headers.origin : "";
  const safeOrigin = /^https:\/\/[a-z0-9-]+\.(manus\.space|manus\.computer)$/i.test(candidate)
    || (process.env.NODE_ENV !== "production" && /^http:\/\/localhost(?::\d+)?$/i.test(candidate));
  return safeOrigin ? candidate : "https://tradejournal-cyqzmlgm.manus.space";
}

async function ensureStripeCustomer(userId: number) {
  const user = await getUserById(userId);
  if (!user) throw new Error("Member not found");
  if (user.stripeCustomerId) return { user, customerId: user.stripeCustomerId };
  const customer = await getStripeClient().customers.create({
    email: user.email || undefined,
    name: user.name || undefined,
    metadata: { user_id: String(user.id), customer_email: user.email || "", customer_name: user.name || "" },
  });
  await updateStripeReferences(user.id, { stripeCustomerId: customer.id });
  clearMembershipCache(user.id);
  return { user: { ...user, stripeCustomerId: customer.id }, customerId: customer.id };
}

async function hasUsedTrial(customerId: string) {
  const subscriptions = await getStripeClient().subscriptions.list({ customer: customerId, status: "all", limit: 100 });
  return subscriptions.data.some(subscription => subscription.trial_start !== null || subscription.trial_end !== null);
}

async function ensureProPriceId() {
  if (proPriceIdPromise) return proPriceIdPromise;
  proPriceIdPromise = (async () => {
    const stripe = getStripeClient();
    const productKey = TRADE_FUSION_PRO.key;
    const products = await stripe.products.list({ active: true, limit: 100 });
    let product = products.data.find(candidate => candidate.metadata.trade_fusion_product_key === productKey);
    if (!product) {
      product = await stripe.products.create({
        name: TRADE_FUSION_PRO.name,
        description: TRADE_FUSION_PRO.description,
        metadata: { trade_fusion_product_key: productKey },
      });
    }
    const prices = await stripe.prices.list({ product: product.id, active: true, type: "recurring", limit: 100 });
    const existing = prices.data.find(price => price.currency === TRADE_FUSION_PRO.currency && price.unit_amount === TRADE_FUSION_PRO.unitAmount && price.recurring?.interval === TRADE_FUSION_PRO.interval && price.recurring.interval_count === TRADE_FUSION_PRO.intervalCount);
    if (existing) return existing.id;
    const created = await stripe.prices.create({
      product: product.id,
      currency: TRADE_FUSION_PRO.currency,
      unit_amount: TRADE_FUSION_PRO.unitAmount,
      recurring: { interval: TRADE_FUSION_PRO.interval, interval_count: TRADE_FUSION_PRO.intervalCount },
      metadata: { trade_fusion_product_key: productKey },
    });
    return created.id;
  })().catch(error => {
    proPriceIdPromise = null;
    throw error;
  });
  return proPriceIdPromise;
}

export async function createProCheckout(userId: number, req: Request) {
  const { user, customerId } = await ensureStripeCustomer(userId);
  const usedTrial = await hasUsedTrial(customerId);
  const origin = billingOrigin(req);
  const proPriceId = await ensureProPriceId();
  const session = await getStripeClient().checkout.sessions.create({
    mode: "subscription",
    customer: customerId,
    client_reference_id: String(user.id),
    metadata: { user_id: String(user.id), customer_email: user.email || "", customer_name: user.name || "" },
    subscription_data: {
      metadata: { user_id: String(user.id), customer_email: user.email || "", customer_name: user.name || "" },
      ...(usedTrial ? {} : { trial_period_days: TRADE_FUSION_PRO.trialDays }),
    },
    line_items: [{ price: proPriceId, quantity: 1 }],
    payment_method_collection: "always",
    allow_promotion_codes: true,
    managed_payments: { enabled: false },
    success_url: `${origin}/app/account?checkout=success&session_id={CHECKOUT_SESSION_ID}`,
    cancel_url: `${origin}/?checkout=cancelled#pricing`,
  });
  if (!session.url) throw new Error("Stripe did not return a checkout URL");
  return { url: session.url, trialApplied: !usedTrial };
}

export async function createBillingPortal(userId: number, req: Request) {
  const user = await getUserById(userId);
  if (!user?.stripeCustomerId) throw new Error("No billing profile is available for this member");
  const session = await getStripeClient().billingPortal.sessions.create({ customer: user.stripeCustomerId, return_url: `${billingOrigin(req)}/app/account` });
  return session.url;
}

export async function listBillingHistory(userId: number) {
  const user = await getUserById(userId);
  if (!user?.stripeCustomerId) return [];
  const invoices = await getStripeClient().invoices.list({ customer: user.stripeCustomerId, limit: 12 });
  return invoices.data.filter(invoice => invoice.status === "paid").map(invoice => ({
    id: invoice.id,
    date: new Date(invoice.created * 1_000).toISOString(),
    amountPaid: invoice.amount_paid,
    currency: invoice.currency,
    status: invoice.status,
    item: invoice.lines.data[0]?.description || TRADE_FUSION_PRO.name,
  }));
}

function eventUserId(event: Stripe.Event) {
  const object = event.data.object as Stripe.Checkout.Session | Stripe.Subscription;
  const metadataId = object.metadata?.user_id;
  const referenceId = "client_reference_id" in object ? object.client_reference_id : null;
  const raw = metadataId || referenceId;
  const userId = Number(raw);
  return Number.isInteger(userId) && userId > 0 ? userId : null;
}

async function syncStripeIdentifiers(event: Stripe.Event) {
  const object = event.data.object as Stripe.Checkout.Session | Stripe.Subscription;
  const userId = eventUserId(event);
  const customerId = stripeId("customer" in object ? object.customer : null);
  const subscriptionId = stripeId("subscription" in object ? object.subscription : ("id" in object && event.type.startsWith("customer.subscription.") ? object : null));
  const user = userId ? await getUserById(userId) : customerId ? await getUserByStripeCustomerId(customerId) : undefined;
  if (!user) {
    console.warn("[Stripe] Received a subscription event without a matching Trade Fusion member", { eventId: event.id, eventType: event.type });
    return;
  }
  await updateStripeReferences(user.id, {
    ...(customerId ? { stripeCustomerId: customerId } : {}),
    ...(subscriptionId ? { stripeSubscriptionId: subscriptionId } : {}),
  });
  clearMembershipCache(user.id);
}

export function registerStripeWebhook(app: Express) {
  app.post("/api/stripe/webhook", express.raw({ type: "application/json" }), async (req: Request, res: Response) => {
    const signature = req.headers["stripe-signature"];
    if (typeof signature !== "string" || !process.env.STRIPE_WEBHOOK_SECRET) return res.status(400).json({ error: "Missing Stripe signature" });
    let event: Stripe.Event;
    try {
      event = getStripeClient().webhooks.constructEvent(req.body, signature, process.env.STRIPE_WEBHOOK_SECRET);
    } catch (error) {
      console.warn("[Stripe] Webhook signature verification failed", error instanceof Error ? error.message : "unknown");
      return res.status(400).json({ error: "Invalid Stripe signature" });
    }
    if (event.id.startsWith("evt_test_")) {
      console.log("[Webhook] Test event detected, returning verification response");
      return res.json({ verified: true });
    }
    try {
      if (event.type === "checkout.session.completed" || event.type === "customer.subscription.created" || event.type === "customer.subscription.updated" || event.type === "customer.subscription.deleted") {
        await syncStripeIdentifiers(event);
      }
      console.log("[Stripe] Webhook processed", { eventId: event.id, eventType: event.type, created: event.created });
      return res.json({ received: true });
    } catch (error) {
      console.error("[Stripe] Webhook processing failed", { eventId: event.id, eventType: event.type, error: error instanceof Error ? error.message : "unknown" });
      return res.status(500).json({ error: "Webhook processing failed" });
    }
  });
}
