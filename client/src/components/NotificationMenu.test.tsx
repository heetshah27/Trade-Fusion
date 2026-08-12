// @vitest-environment jsdom
import React from "react";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  markAllRead: vi.fn(),
  markRead: vi.fn(),
  setLocation: vi.fn(),
  invalidate: vi.fn(),
}));

vi.mock("@/lib/trpc", () => ({
  trpc: {
    useUtils: () => ({ notifications: { list: { invalidate: mocks.invalidate }, unreadCount: { invalidate: mocks.invalidate } } }),
    notifications: {
      list: { useQuery: () => ({ data: [{ id: 12, type: "post_reply", postId: 7, commentId: 9, reaction: null, readAt: null, createdAt: new Date(), actorName: "Ava Trader" }] }) },
      unreadCount: { useQuery: () => ({ data: { count: 1 } }) },
      markAllRead: { useMutation: () => ({ mutate: mocks.markAllRead, isPending: false }) },
      markRead: { useMutation: () => ({ mutate: mocks.markRead, isPending: false }) },
    },
  },
}));

vi.mock("wouter", () => ({ useLocation: () => ["/app", mocks.setLocation] }));

import { NotificationMenu } from "./NotificationMenu";

describe("NotificationMenu", () => {
  beforeEach(() => {
    mocks.markAllRead.mockReset();
    mocks.markRead.mockReset();
    mocks.setLocation.mockReset();
  });

  it("shows unread community activity and marks the opened notification as read", async () => {
    const user = userEvent.setup();
    Object.defineProperty(window, "innerWidth", { configurable: true, value: 375 });
    render(<NotificationMenu />);

    expect(screen.getByLabelText("Notifications")).toBeTruthy();
    await user.click(screen.getByLabelText("Notifications"));
    expect(screen.getByText("Ava Trader replied to your discussion")).toBeTruthy();
    expect(screen.getByText("1")).toBeTruthy();
    expect(screen.getByText("Notifications").parentElement?.parentElement?.parentElement?.className).toContain("w-[min(22rem,calc(100vw-2rem))]");

    await user.click(screen.getByText("Ava Trader replied to your discussion"));
    expect(mocks.markRead).toHaveBeenCalledWith({ notificationId: 12 });
    expect(mocks.setLocation).toHaveBeenCalledWith("/app/room");
  });
});
