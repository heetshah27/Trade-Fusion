import { describe, expect, it, vi } from "vitest";
import type { Express, Request, Response } from "express";
import { COOKIE_NAME, encodeOAuthState, OAUTH_STATE_COOKIE } from "../shared/const";

const mocks = vi.hoisted(() => ({
  upsertUser: vi.fn(),
  exchangeCodeForToken: vi.fn(),
  getUserInfo: vi.fn(),
  createSessionToken: vi.fn(),
  getSessionCookieOptions: vi.fn(),
}));

vi.mock("./db", () => ({ upsertUser: mocks.upsertUser }));
vi.mock("./_core/sdk", () => ({
  sdk: {
    exchangeCodeForToken: mocks.exchangeCodeForToken,
    getUserInfo: mocks.getUserInfo,
    createSessionToken: mocks.createSessionToken,
  },
}));
vi.mock("./_core/cookies", () => ({ getSessionCookieOptions: mocks.getSessionCookieOptions }));

import { AUTHENTICATED_WORKSPACE_PATH, registerOAuthRoutes } from "./_core/oauth";

type CallbackHandler = (req: Request, res: Response) => Promise<void>;

describe("OAuth return destination", () => {
  it("creates the authenticated session and redirects a successful callback to the protected dashboard", async () => {
    const nonce = "dashboard-return-nonce";
    const state = encodeOAuthState({ redirectUri: "https://tradefusion.example/api/oauth/callback", nonce });
    const exchangeCodeForToken = mocks.exchangeCodeForToken.mockResolvedValue({ accessToken: "access-token" });
    mocks.getUserInfo.mockResolvedValue({ openId: "member-open-id", name: "Member", email: "member@example.com", loginMethod: "manus" });
    mocks.createSessionToken.mockResolvedValue("session-token");
    mocks.getSessionCookieOptions.mockReturnValue({ httpOnly: true, secure: true, sameSite: "none", path: "/" });

    let callback: CallbackHandler | undefined;
    const app = {
      get: vi.fn((_path: string, handler: CallbackHandler) => { callback = handler; }),
    } as unknown as Express;
    registerOAuthRoutes(app);

    const response = {
      clearCookie: vi.fn(),
      cookie: vi.fn(),
      redirect: vi.fn(),
      status: vi.fn().mockReturnThis(),
      json: vi.fn(),
    } as unknown as Response;
    const request = {
      query: { code: "exchange-code", state },
      headers: { cookie: `${OAUTH_STATE_COOKIE}=${nonce}` },
    } as unknown as Request;

    await callback!(request, response);

    expect(exchangeCodeForToken).toHaveBeenCalledWith("exchange-code", state);
    expect(mocks.upsertUser).toHaveBeenCalledWith(expect.objectContaining({ openId: "member-open-id", email: "member@example.com" }));
    expect(mocks.createSessionToken).toHaveBeenCalledWith("member-open-id", expect.objectContaining({ name: "Member" }));
    expect(response.cookie).toHaveBeenCalledWith(COOKIE_NAME, "session-token", expect.objectContaining({ httpOnly: true }));
    expect(response.redirect).toHaveBeenCalledWith(302, AUTHENTICATED_WORKSPACE_PATH);
  });
});
