import { createHash } from "node:crypto";
import { protectedProcedure, router } from "./_core/trpc";

export function emailAvatarUrl(email: string | null | undefined) {
  const normalizedEmail = email?.trim().toLowerCase();
  if (!normalizedEmail) return null;
  const hash = createHash("md5").update(normalizedEmail).digest("hex");
  return `https://www.gravatar.com/avatar/${hash}?s=256&d=identicon&r=g`;
}

export const accountRouter = router({
  profile: protectedProcedure.query(({ ctx }) => ({
    name: ctx.user.name?.trim() || "Trader",
    email: ctx.user.email,
    role: ctx.user.role,
    tradingStyle: ctx.user.tradingStyle,
    avatarUrl: emailAvatarUrl(ctx.user.email),
  })),
});
