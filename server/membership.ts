import { and, count, eq, gte } from "drizzle-orm";
import { TRPCError } from "@trpc/server";
import { communityPosts, trades } from "../drizzle/schema";
import { getDb, getUserById } from "./db";
import { canReadBacktest, canWriteBacktest, FREE_MONTHLY_THREAD_LIMIT, FREE_MONTHLY_TRADE_LIMIT, remainingMonthlyAllowance, resolveBacktestAccess, startOfUtcCalendarMonth, type BacktestAccess } from "./billingPolicy";
import { getStripeClient, isStripeConfigured } from "./stripe";

type Membership = {
  tier: "free" | "pro";
  backtestAccess: BacktestAccess;
  subscriptionStatus: string | null;
  billingReady: boolean;
};

const membershipCache = new Map<number, { expiresAt: number; value: Membership }>();
const MEMBERSHIP_CACHE_MS = 30_000;

export function clearMembershipCache(userId: number) {
  membershipCache.delete(userId);
}

export async function getMemberMembership(userId: number): Promise<Membership> {
  const cached = membershipCache.get(userId);
  if (cached && cached.expiresAt > Date.now()) return cached.value;

  if (!isStripeConfigured()) {
    return { tier: "free", backtestAccess: "locked", subscriptionStatus: null, billingReady: false };
  }

  const user = await getUserById(userId);
  if (!user?.stripeSubscriptionId) {
    const membership = { tier: "free" as const, backtestAccess: "locked" as const, subscriptionStatus: null, billingReady: true };
    membershipCache.set(userId, { value: membership, expiresAt: Date.now() + MEMBERSHIP_CACHE_MS });
    return membership;
  }

  try {
    const subscription = await getStripeClient().subscriptions.retrieve(user.stripeSubscriptionId);
    const currentPeriodEnd = subscription.items.data.reduce<number | null>((latest, item) => {
      const itemEnd = item.current_period_end ?? null;
      return itemEnd !== null && (latest === null || itemEnd > latest) ? itemEnd : latest;
    }, null);
    const access = resolveBacktestAccess({
      status: subscription.status,
      currentPeriodEnd,
      canceledAt: subscription.canceled_at ?? null,
    });
    const membership = {
      tier: access === "full" ? "pro" as const : "free" as const,
      backtestAccess: access,
      subscriptionStatus: subscription.status,
      billingReady: true,
    };
    membershipCache.set(userId, { value: membership, expiresAt: Date.now() + MEMBERSHIP_CACHE_MS });
    return membership;
  } catch (error) {
    console.error("[Billing] Subscription lookup failed", { userId, error: error instanceof Error ? error.message : "unknown" });
    return { tier: "free", backtestAccess: "locked", subscriptionStatus: "unavailable", billingReady: true };
  }
}

export async function requireBacktestAccess(userId: number, write = false) {
  const membership = await getMemberMembership(userId);
  const allowed = write ? canWriteBacktest(membership.backtestAccess) : canReadBacktest(membership.backtestAccess);
  if (!allowed) {
    const message = membership.backtestAccess === "read_only"
      ? "Backtest is read-only until your Pro subscription is renewed."
      : "Backtest is available with Trade Fusion Pro.";
    throw new TRPCError({ code: "FORBIDDEN", message });
  }
  return membership;
}

export async function getMonthlyUsage(userId: number, now = new Date()) {
  const db = await getDb();
  if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database not available" });
  const monthStart = startOfUtcCalendarMonth(now);
  const [tradeUsage] = await db.select({ total: count() }).from(trades).where(and(eq(trades.userId, userId), gte(trades.createdAt, monthStart)));
  const [threadUsage] = await db.select({ total: count() }).from(communityPosts).where(and(eq(communityPosts.authorId, userId), gte(communityPosts.createdAt, monthStart)));
  const tradeCount = Number(tradeUsage?.total ?? 0);
  const threadCount = Number(threadUsage?.total ?? 0);
  return {
    monthStart: monthStart.toISOString(),
    trades: { used: tradeCount, limit: FREE_MONTHLY_TRADE_LIMIT, remaining: remainingMonthlyAllowance(FREE_MONTHLY_TRADE_LIMIT, tradeCount) },
    threads: { used: threadCount, limit: FREE_MONTHLY_THREAD_LIMIT, remaining: remainingMonthlyAllowance(FREE_MONTHLY_THREAD_LIMIT, threadCount) },
  };
}

export async function enforceFreeTradeLimit(userId: number) {
  const membership = await getMemberMembership(userId);
  if (membership.tier === "pro") return;
  const usage = await getMonthlyUsage(userId);
  if (usage.trades.used >= FREE_MONTHLY_TRADE_LIMIT) {
    throw new TRPCError({ code: "FORBIDDEN", message: `Free members can create up to ${FREE_MONTHLY_TRADE_LIMIT} live trades each calendar month. Upgrade to Pro for unlimited trading journals.` });
  }
}

export async function enforceFreeThreadLimit(userId: number) {
  const membership = await getMemberMembership(userId);
  if (membership.tier === "pro") return;
  const usage = await getMonthlyUsage(userId);
  if (usage.threads.used >= FREE_MONTHLY_THREAD_LIMIT) {
    throw new TRPCError({ code: "FORBIDDEN", message: `Free members can start up to ${FREE_MONTHLY_THREAD_LIMIT} Trader’s Room discussions each calendar month. Replies remain available.` });
  }
}
