// @vitest-environment jsdom
import React from "react";
import { render, screen, waitFor } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

vi.mock("@/_core/hooks/useAuth", () => ({ useAuth: () => ({ loading: false, isAuthenticated: false }) }));
vi.mock("@/const", () => ({ startLogin: vi.fn() }));
vi.mock("framer-motion", () => {
  const Motion = ({ children, initial: _initial, animate: _animate, exit: _exit, transition: _transition, ...props }: React.PropsWithChildren<Record<string, unknown>>) => <div {...props}>{children}</div>;
  return { AnimatePresence: ({ children }: React.PropsWithChildren) => <>{children}</>, motion: { main: Motion, div: Motion }, useReducedMotion: () => true };
});

import LaunchGate from "./LaunchGate";

describe("LaunchGate branding", () => {
  it("keeps Trade Fusion branding visible after the loading intro transitions to sign-in", async () => {
    render(<LaunchGate><div>Protected workspace</div></LaunchGate>);
    expect(screen.getByLabelText("Trade Fusion loading")).toBeTruthy();
    expect(screen.getByLabelText("Trade Fusion")).toBeTruthy();
    expect(screen.getByTestId("trade-fusion-brand")).toBeTruthy();
    expect(screen.getByTestId("trade-fusion-mark")).toBeTruthy();

    await waitFor(() => expect(screen.getByText("Sign in to Trade Fusion")).toBeTruthy());
    expect(screen.getAllByTestId("trade-fusion-brand")).toHaveLength(2);
    expect(screen.getAllByText("Trading Workspace")).toHaveLength(2);
  });
});
