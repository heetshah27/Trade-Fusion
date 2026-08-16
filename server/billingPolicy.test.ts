import { describe, expect, it } from "vitest";
import { BACKTEST_GRACE_PERIOD_MS, FREE_MONTHLY_THREAD_LIMIT, FREE_MONTHLY_TRADE_LIMIT, remainingMonthlyAllowance, resolveBacktestAccess, startOfUtcCalendarMonth } from "./billingPolicy";
import { TRADE_FUSION_PRO } from "./products";

describe("Trade Fusion billing policy", () => {
  it("uses the approved two-tier limits and $10 monthly-only Pro price", () => {
    expect(FREE_MONTHLY_TRADE_LIMIT).toBe(15);
    expect(FREE_MONTHLY_THREAD_LIMIT).toBe(10);
    expect(TRADE_FUSION_PRO.unitAmount).toBe(1_000);
    expect(TRADE_FUSION_PRO.interval).toBe("month");
  });

  it("resets Free allowances at the start of the UTC calendar month", () => {
    expect(startOfUtcCalendarMonth(new Date("2026-08-16T23:59:59.000Z")).toISOString()).toBe("2026-08-01T00:00:00.000Z");
    expect(remainingMonthlyAllowance(15, 16)).toBe(0);
    expect(remainingMonthlyAllowance(10, 4)).toBe(6);
  });

  it("keeps Pro Backtest writable during active, trial, and seven-day grace periods", () => {
    const now = new Date("2026-08-16T00:00:00.000Z");
    expect(resolveBacktestAccess({ status: "active", currentPeriodEnd: null, canceledAt: null }, now)).toBe("full");
    expect(resolveBacktestAccess({ status: "trialing", currentPeriodEnd: null, canceledAt: null }, now)).toBe("full");
    const endedYesterday = Math.floor((now.getTime() - 24 * 60 * 60 * 1_000) / 1_000);
    expect(resolveBacktestAccess({ status: "past_due", currentPeriodEnd: endedYesterday, canceledAt: null }, now)).toBe("full");
    const endedAfterGrace = Math.floor((now.getTime() - BACKTEST_GRACE_PERIOD_MS - 1) / 1_000);
    expect(resolveBacktestAccess({ status: "canceled", currentPeriodEnd: endedAfterGrace, canceledAt: endedAfterGrace }, now)).toBe("read_only");
  });
});
