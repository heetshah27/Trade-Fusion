// @vitest-environment jsdom
import React from "react";
import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

vi.mock("@/lib/trpc", () => ({ trpc: { ticker: { quotes: { useQuery: () => ({ data: undefined }) } } } }));
vi.mock("wouter", () => ({ Link: ({ children, href, ...props }: React.AnchorHTMLAttributes<HTMLAnchorElement>) => <a href={href} {...props}>{children}</a> }));
vi.mock("framer-motion", () => ({
  motion: { div: ({ children, initial: _initial, animate: _animate, transition: _transition, ...props }: React.HTMLAttributes<HTMLDivElement> & { initial?: unknown; animate?: unknown; transition?: unknown }) => <div {...props}>{children}</div> },
  useInView: () => true,
  useReducedMotion: () => true,
}));

import Landing from "./Landing";

describe("Expanded Trade Fusion landing page", () => {
  afterEach(cleanup);

  it("explains Backtest, journaling, setup analytics, community, and the private workflow", () => {
    render(<Landing />);
    expect(screen.getByText("Private replay lab")).toBeTruthy();
    expect(screen.getByText("Execution journal")).toBeTruthy();
    expect(screen.getAllByText("Setup Analytics").length).toBeGreaterThan(1);
    expect(screen.getByText("Open Backtest lab")).toBeTruthy();
    expect(screen.getAllByText("Trader’s Room").length).toBeGreaterThan(0);
    expect(screen.getByText("Capture the execution. Review the pattern. Prepare the next decision.")).toBeTruthy();
    expect(screen.getAllByRole("link", { name: /platform/i }).length).toBeGreaterThan(0);
  });

  it("includes the structured marketing footer with workspace routes and declared social placeholders", () => {
    render(<Landing />);
    expect(screen.getByText("Start reviewing")).toBeTruthy();
    expect(screen.getAllByText("Performance Journal").length).toBeGreaterThan(1);
    expect(screen.getByText("Account Settings")).toBeTruthy();
    expect(screen.getByRole("button", { name: "Trade Fusion X channel coming soon" })).toBeTruthy();
    expect(screen.getByText("Built for review, not signals")).toBeTruthy();
  });
});
