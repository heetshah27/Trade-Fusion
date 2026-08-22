// @vitest-environment jsdom
import React from "react";
import { act, cleanup, render, screen, waitFor } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { INTRO_DURATION_MS } from "@/lib/launchState";

const state = vi.hoisted(() => ({ loading: false, isAuthenticated: false, reducedMotion: true }));

vi.mock("@/_core/hooks/useAuth", () => ({ useAuth: () => ({ loading: state.loading, isAuthenticated: state.isAuthenticated }) }));
vi.mock("@/const", () => ({ startLogin: vi.fn() }));
vi.mock("framer-motion", () => {
  const Motion = ({ children, initial: _initial, animate: _animate, exit: _exit, transition: _transition, ...props }: React.PropsWithChildren<Record<string, unknown>>) => <div {...props}>{children}</div>;
  return { AnimatePresence: ({ children }: React.PropsWithChildren) => <>{children}</>, motion: { main: Motion, div: Motion }, useReducedMotion: () => state.reducedMotion };
});

import LaunchGate from "./LaunchGate";

describe("LaunchGate branding", () => {
  afterEach(() => {
    cleanup();
    state.loading = false;
    state.isAuthenticated = false;
    state.reducedMotion = true;
    window.sessionStorage.clear();
    vi.useRealTimers();
  });

  it("keeps Trade Fusion branding visible after the loading intro transitions to sign-in", async () => {
    render(<LaunchGate><div>Protected workspace</div></LaunchGate>);
    expect(screen.getByLabelText("Trade Fusion loading")).toBeTruthy();
    expect(screen.getByLabelText("Trade Fusion")).toBeTruthy();
    expect(screen.getByTestId("trade-fusion-brand")).toBeTruthy();
    expect(screen.getByTestId("trade-fusion-mark")).toBeTruthy();

    await waitFor(() => expect(screen.getByText("Continue to login or sign up")).toBeTruthy());
    expect(screen.getByText("After secure access, you will enter your Trade Fusion dashboard.")).toBeTruthy();
    expect(screen.getAllByTestId("trade-fusion-brand")).toHaveLength(2);
    expect(screen.getAllByText("Trading Workspace")).toHaveLength(2);
  });

  it("shows the startup animation before revealing the public landing content", async () => {
    render(<LaunchGate mode="public"><div>Public landing page</div></LaunchGate>);

    expect(screen.getByLabelText("Trade Fusion loading")).toBeTruthy();
    await waitFor(() => expect(screen.getByText("Public landing page")).toBeTruthy());
    expect(screen.queryByText("Continue to login or sign up")).toBeNull();
  });

  it("uses the onboarding-specific secure sign-in loading message after Get Started", () => {
    window.sessionStorage.setItem("trade-fusion:onboarding-entry", "true");
    render(<LaunchGate><div>Protected workspace</div></LaunchGate>);

    expect(screen.getByText("Preparing secure sign-in")).toBeTruthy();
  });

  it("opens the workspace directly for an existing authenticated session", async () => {
    state.isAuthenticated = true;
    render(<LaunchGate><div>Protected workspace</div></LaunchGate>);

    await waitFor(() => expect(screen.getByText("Protected workspace")).toBeTruthy());
    expect(screen.queryByTestId("dashboard-opening-transition")).toBeNull();
  });

  it("shows a brief secure dashboard-opening transition before rendering the authenticated workspace", async () => {
    state.isAuthenticated = true;
    state.reducedMotion = false;
    window.sessionStorage.setItem("trade-fusion:login-return", "true");
    vi.useFakeTimers();
    render(<LaunchGate><div>Protected workspace</div></LaunchGate>);

    await act(async () => { vi.advanceTimersByTime(INTRO_DURATION_MS); });
    expect(screen.getByTestId("dashboard-opening-transition")).toBeTruthy();
    expect(screen.getByText("Opening your dashboard")).toBeTruthy();
    expect(screen.queryByText("Protected workspace")).toBeNull();

    await act(async () => { vi.advanceTimersByTime(520); });
    expect(screen.getByText("Protected workspace")).toBeTruthy();
  });
});
