export const FREE_MONTHLY_TRADE_LIMIT = 15;
export const FREE_MONTHLY_THREAD_LIMIT = 10;
export const BACKTEST_GRACE_PERIOD_DAYS = 7;
export const BACKTEST_GRACE_PERIOD_MS = BACKTEST_GRACE_PERIOD_DAYS * 24 * 60 * 60 * 1_000;

export type BacktestAccess = "full" | "read_only" | "locked";

export type SubscriptionSnapshot = {
  status: string;
  currentPeriodEnd: number | null;
  canceledAt: number | null;
};

export function startOfUtcCalendarMonth(now = new Date()) {
  return new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1));
}

export function remainingMonthlyAllowance(limit: number, used: number) {
  return Math.max(0, limit - Math.max(0, used));
}

function graceEnd(snapshot: SubscriptionSnapshot) {
  const endingSeconds = snapshot.currentPeriodEnd ?? snapshot.canceledAt;
  return endingSeconds === null ? null : endingSeconds * 1_000 + BACKTEST_GRACE_PERIOD_MS;
}

/**
 * Stripe remains the source of truth for subscription state. We derive access
 * at request time instead of persisting a second, potentially stale status.
 */
export function resolveBacktestAccess(snapshot: SubscriptionSnapshot | null, now = new Date()): BacktestAccess {
  if (!snapshot) return "locked";
  if (snapshot.status === "active" || snapshot.status === "trialing") return "full";
  if (snapshot.status === "past_due" || snapshot.status === "canceled" || snapshot.status === "unpaid" || snapshot.status === "incomplete_expired") {
    const expiresAt = graceEnd(snapshot);
    return expiresAt !== null && now.getTime() <= expiresAt ? "full" : "read_only";
  }
  return "locked";
}

export function canReadBacktest(access: BacktestAccess) {
  return access === "full" || access === "read_only";
}

export function canWriteBacktest(access: BacktestAccess) {
  return access === "full";
}
