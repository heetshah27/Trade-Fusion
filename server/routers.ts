import { COOKIE_NAME } from "@shared/const";
import { getSessionCookieOptions } from "./_core/cookies";
import { systemRouter } from "./_core/systemRouter";
import { publicProcedure, router } from "./_core/trpc";
import { tradesRouter } from "./trades";
import { calendarRouter } from "./calendar";
import { communityRouter } from "./community";
import { accountRouter } from "./account";
import { notificationsRouter } from "./notifications";
import { tickerRouter } from "./ticker";
import { backtestRouter } from "./backtest";
import { replayRouter } from "./replay";

export const appRouter = router({
    // if you need to use socket.io, read and register route in server/_core/index.ts, all api should start with '/api/' so that the gateway can route correctly
  system: systemRouter,
  auth: router({
    me: publicProcedure.query(opts => opts.ctx.user),
    logout: publicProcedure.mutation(({ ctx }) => {
      const cookieOptions = getSessionCookieOptions(ctx.req);
      ctx.res.clearCookie(COOKIE_NAME, { ...cookieOptions, maxAge: -1 });
      return {
        success: true,
      } as const;
    }),
  }),

  // TODO: add feature routers here, e.g.
  trades: tradesRouter,
  calendar: calendarRouter,
  community: communityRouter,
  account: accountRouter,
  notifications: notificationsRouter,
  ticker: tickerRouter,
  backtest: backtestRouter,
  replay: replayRouter,

  // TODO: add more feature routers here, e.g.
  // todo: router({
  //   list: protectedProcedure.query(({ ctx }) =>
  //     db.getUserTodos(ctx.user.id)
  //   ),
  // }),
});

export type AppRouter = typeof appRouter;
