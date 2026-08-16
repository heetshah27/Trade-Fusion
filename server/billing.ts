import { TRPCError } from "@trpc/server";
import { protectedProcedure, router } from "./_core/trpc";
import { createBillingPortal, createProCheckout, isStripeConfigured, listBillingHistory } from "./stripe";
import { getMemberMembership, getMonthlyUsage } from "./membership";
import { TRADE_FUSION_PRO } from "./products";

function billingUnavailable() {
  return new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Payments are temporarily unavailable. Please try again shortly." });
}

export const billingRouter = router({
  status: protectedProcedure.query(async ({ ctx }) => {
    const [membership, usage] = await Promise.all([getMemberMembership(ctx.user.id), getMonthlyUsage(ctx.user.id)]);
    return { ...membership, usage, product: { price: TRADE_FUSION_PRO.displayPrice, cadence: TRADE_FUSION_PRO.displayCadence, trialDays: TRADE_FUSION_PRO.trialDays } };
  }),

  createCheckout: protectedProcedure.mutation(async ({ ctx }) => {
    if (!isStripeConfigured()) throw billingUnavailable();
    const membership = await getMemberMembership(ctx.user.id);
    if (membership.backtestAccess === "full") {
      throw new TRPCError({ code: "BAD_REQUEST", message: "Your Pro access is already active. Use Manage billing to review your subscription." });
    }
    try {
      return await createProCheckout(ctx.user.id, ctx.req);
    } catch (error) {
      console.error("[Billing] Checkout creation failed", error instanceof Error ? error.message : "unknown");
      throw billingUnavailable();
    }
  }),

  createPortal: protectedProcedure.mutation(async ({ ctx }) => {
    if (!isStripeConfigured()) throw billingUnavailable();
    try {
      return { url: await createBillingPortal(ctx.user.id, ctx.req) };
    } catch (error) {
      console.error("[Billing] Portal creation failed", error instanceof Error ? error.message : "unknown");
      throw new TRPCError({ code: "NOT_FOUND", message: "No billing profile is available yet." });
    }
  }),

  history: protectedProcedure.query(async ({ ctx }) => {
    if (!isStripeConfigured()) return [];
    try {
      return await listBillingHistory(ctx.user.id);
    } catch (error) {
      console.error("[Billing] Invoice history lookup failed", error instanceof Error ? error.message : "unknown");
      throw billingUnavailable();
    }
  }),
});
