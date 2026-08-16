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

  it("explains saved setups, setup analytics, Backtest, and the private workflow", () => {
    render(<Landing />);
    expect(screen.getByText("Saved Setups")).toBeTruthy();
    expect(screen.getByText("Setup Analytics")).toBeTruthy();
    expect(screen.getByText("Backtest Lab")).toBeTruthy();
    expect(screen.getByText("The Trade Fusion loop")).toBeTruthy();
    expect(screen.getByText("One private system for the work before, during, and after a trade.")).toBeTruthy();
    expect(screen.getAllByRole("link", { name: /platform/i }).length).toBeGreaterThan(0);
  });
});
