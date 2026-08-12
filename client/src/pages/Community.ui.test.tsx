// @vitest-environment jsdom
import React from "react";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  reactToPost: vi.fn(),
  reactToComment: vi.fn(),
  invalidate: vi.fn(),
}));

vi.mock("@/components/ui/button", () => ({
  Button: ({ children, ...props }: any) => <button {...props}>{children}</button>,
}));

vi.mock("@/components/ui/card", () => ({
  Card: ({ children, ...props }: any) => <div {...props}>{children}</div>,
}));

vi.mock("@/_core/hooks/useAuth", () => ({
  useAuth: () => ({ user: { id: 7, role: "user" } }),
}));

vi.mock("@/lib/trpc", () => {
  const post = {
    id: 12,
    authorId: 7,
    authorName: "Ava Trader",
    isFounder: true,
    authorTradingStyle: "day_trader",
    category: "trade_ideas",
    title: "Gold long",
    body: "Holding above the London range for a measured continuation setup.",
    createdAt: new Date("2026-08-12T12:00:00Z"),
    isOwner: true,
    attachments: [{ id: 50, url: "/manus-storage/chart.png", fileName: "gold-chart.png" }],
    reactions: { counts: { insightful: 2, support: 1, question: 0 }, viewerReaction: "insightful" },
    comments: [{
      id: 21,
      authorId: 8,
      authorName: "Ben FX",
      isFounder: false,
      authorTradingStyle: "forex_trader",
      body: "The level looks constructive if the stop remains defined.",
      createdAt: new Date("2026-08-12T12:05:00Z"),
      reactions: { counts: { insightful: 0, support: 1, question: 0 }, viewerReaction: null },
    }],
  };
  const mutation = (fn = vi.fn()) => ({ mutate: fn, mutateAsync: fn, isPending: false });
  return {
    trpc: {
      useUtils: () => ({ community: { list: { invalidate: mocks.invalidate }, profile: { get: { invalidate: mocks.invalidate } } } }),
      community: {
        list: { useQuery: () => ({ data: [post], isLoading: false, isFetching: false }) },
        profile: {
          get: { useQuery: () => ({ data: { tradingStyle: "day_trader", isFounder: true } }) },
          setTradingStyle: { useMutation: () => mutation() },
        },
        createPost: { useMutation: () => mutation() },
        uploadAttachment: { useMutation: () => mutation() },
        addComment: { useMutation: () => mutation() },
        removePost: { useMutation: () => mutation() },
        reportPost: { useMutation: () => mutation() },
        reactToPost: { useMutation: () => mutation(mocks.reactToPost) },
        reactToComment: { useMutation: () => mutation(mocks.reactToComment) },
        moderation: {
          listOpenReports: { useQuery: () => ({ data: [] }) },
          resolveReport: { useMutation: () => mutation() },
        },
      },
    },
  };
});

import Community from "./Community";

describe("Populated Trader’s Room community controls", () => {
  afterEach(cleanup);

  beforeEach(() => {
    mocks.reactToPost.mockReset();
    mocks.reactToComment.mockReset();
    mocks.invalidate.mockReset();
  });

  it("renders a populated attachment, author badge, and post reactions at desktop and mobile widths", () => {
    Object.defineProperty(window, "innerWidth", { configurable: true, value: 1280 });
    const { rerender } = render(<Community />);

    expect(screen.getByAltText("gold-chart.png")).toBeTruthy();
    expect(screen.getAllByText("Founder · Moderator")).toHaveLength(2);
    expect(screen.getAllByLabelText("Insightful reaction")).toHaveLength(1);
    expect(screen.getByText("2")).toBeTruthy();
    expect(screen.getByRole("button", { name: "Remove" })).toBeTruthy();

    Object.defineProperty(window, "innerWidth", { configurable: true, value: 375 });
    fireEvent(window, new Event("resize"));
    rerender(<Community />);
    expect(screen.getByAltText("gold-chart.png")).toBeTruthy();
    expect(screen.getAllByText("Founder · Moderator")).toHaveLength(2);
  });

  it("reveals reply-level badges and sends post/comment reaction requests", async () => {
    const user = userEvent.setup();
    render(<Community />);

    await user.click(screen.getByRole("button", { name: "Reply" }));
    expect(screen.getByText("Forex Trader")).toBeTruthy();
    expect(screen.getAllByLabelText("Support reaction")).toHaveLength(2);

    await user.click(screen.getAllByLabelText("Insightful reaction")[0]);
    expect(mocks.reactToPost).toHaveBeenCalledWith({ postId: 12, reaction: "insightful" });

    const supportButtons = screen.getAllByLabelText("Support reaction");
    await user.click(supportButtons[1]);
    expect(mocks.reactToComment).toHaveBeenCalledWith({ commentId: 21, reaction: "support" });
  });
});
