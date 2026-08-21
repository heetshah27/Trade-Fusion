// @vitest-environment jsdom
import React from "react";
import { cleanup, fireEvent, render, screen, within } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

vi.mock("@/lib/trpc", () => ({ trpc: { ticker: { quotes: { useQuery: () => ({ data: undefined }) } }, contact: { submit: { useMutation: () => ({ mutate: vi.fn(), isPending: false, isSuccess: false, error: null }) } } } }));
vi.mock("wouter", () => ({ Link: ({ children, href, ...props }: React.AnchorHTMLAttributes<HTMLAnchorElement>) => <a href={href} {...props}>{children}</a> }));
vi.mock("framer-motion", () => {
  const Motion = ({ children, initial: _initial, animate: _animate, transition: _transition, style: _style, ...props }: React.HTMLAttributes<HTMLElement> & { initial?: unknown; animate?: unknown; transition?: unknown }) => <div {...props}>{children}</div>;
  return {
    motion: { div: Motion, article: Motion },
    useInView: () => true,
    useReducedMotion: () => true,
    useScroll: () => ({ scrollYProgress: 0 }),
    useTransform: () => 0,
  };
});

import Landing from "./Landing";

describe("Expanded Trade Fusion landing page", () => {
  afterEach(cleanup);

  it("explains Backtest, journaling, setup analytics, community, and the private workflow", () => {
    render(<Landing />);
    expect(screen.getByText("Private replay lab")).toBeTruthy();
    expect(screen.getByText("Execution journal")).toBeTruthy();
    expect(screen.getAllByText("Setup Analytics").length).toBeGreaterThan(1);
    expect(screen.getByText("Explore Pro Backtest")).toBeTruthy();
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

  it("includes an accessible landing-page FAQ that explains product scope and private ownership", () => {
    render(<Landing />);

    expect(screen.getByRole("heading", { name: "Frequently asked questions" })).toBeTruthy();
    expect(screen.getByRole("button", { name: "Is my data private?" })).toBeTruthy();
    expect(screen.getByRole("link", { name: "FAQ" })).toBeTruthy();

    fireEvent.click(screen.getByRole("button", { name: "Is my data private?" }));
    expect(screen.getByText(/nothing from your private journal is shared there automatically/i)).toBeTruthy();
  });

  it("presents the approved Free and $10 monthly Pro plans without an annual billing option", () => {
    render(<Landing />);

    expect(screen.getByText("Simple, focused access")).toBeTruthy();
    expect(screen.getByText("Build the review habit.")).toBeTruthy();
    expect(screen.getByText("Rehearse with more conviction.")).toBeTruthy();
    expect(screen.getByText("$10")).toBeTruthy();
    expect(screen.getByText("USD / month")).toBeTruthy();
    expect(screen.getByText(/monthly billing only\. no annual plan at launch/i)).toBeTruthy();
    expect(screen.getByText(/15 new live trades per calendar month/i)).toBeTruthy();
    expect(screen.getByText(/10 new trader’s room threads per month/i)).toBeTruthy();
    expect(screen.getByRole("link", { name: /start 7-day pro trial/i })).toBeTruthy();
  });

  it("adds a streamlined landing contact form without exposing the owner’s phone number", () => {
    render(<Landing />);

    expect(screen.getByRole("heading", { name: "Start a focused conversation." })).toBeTruthy();
    expect(screen.getByLabelText("Name")).toBeTruthy();
    expect(screen.getByLabelText("Email")).toBeTruthy();
    expect(screen.getByLabelText("Message")).toBeTruthy();
    expect(screen.getByRole("button", { name: /send message/i })).toBeTruthy();
    expect(screen.queryByText(/WhatsApp number/i)).toBeNull();
    expect(screen.queryByText("Private inquiry route")).toBeNull();
  });

  it("adds Backtest as an interactive first-class workspace-preview module", () => {
    render(<Landing />);

    fireEvent.click(screen.getByRole("button", { name: "Backtest" }));

    expect(screen.getByText("Backtest Lab · XAU/USD")).toBeTruthy();
    expect(screen.getByText("Private Replay Workspace")).toBeTruthy();
    expect(screen.getByText(/Backtest sessions, zones, and simulated entries/i)).toBeTruthy();
    expect(screen.getByRole("button", { name: "Backtest Lab" })).toBeTruthy();
  });

  it("keeps the preview module switcher keyboard-readable with explicit active-tab state", () => {
    render(<Landing />);

    const journalTab = screen.getByRole("button", { name: "Journal" });
    expect(journalTab.getAttribute("aria-pressed")).toBe("true");
    fireEvent.click(screen.getByRole("button", { name: "Calendar" }));
    expect(screen.getByRole("button", { name: "Calendar" }).getAttribute("aria-pressed")).toBe("true");
  });

  it("includes scroll-linked depth treatment for the workspace preview and product spotlights", () => {
    render(<Landing />);

    expect(screen.getByTestId("scroll-linked-workspace-preview")).toBeTruthy();
    expect(screen.getByTestId("workspace-preview-laptop")).toBeTruthy();
    expect(screen.getByTestId("laptop-screen-reflection")).toBeTruthy();
    expect(screen.getAllByTestId("scroll-linked-spotlight")).toHaveLength(4);
    expect(screen.getByTestId("workspace-preview-tab-panel")).toBeTruthy();
  });

  it("offers a compact mobile section-progress control with accessible landing shortcuts", () => {
    render(<Landing />);
    const progress = screen.getByTestId("mobile-section-progress");
    const trigger = within(progress).getByRole("button", { name: /current section: start/i });
    expect(trigger.getAttribute("aria-expanded")).toBe("false");
    fireEvent.click(trigger);
    expect(trigger.getAttribute("aria-expanded")).toBe("true");
    expect(within(progress).getByRole("link", { name: /pricing/i }).getAttribute("href")).toBe("#pricing");
  });
});
