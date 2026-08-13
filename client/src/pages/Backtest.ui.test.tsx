// @vitest-environment jsdom
import React from "react";
import { cleanup, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({ createSession: vi.fn(), invalidate: vi.fn(), reopenSession: vi.fn() }));

vi.mock("@/lib/trpc", () => ({
  trpc: {
    useUtils: () => ({ backtest: { listSessions: { invalidate: mocks.invalidate }, getSession: { invalidate: mocks.invalidate } } }),
    backtest: {
      listSessions: { useQuery: () => ({ data: [], isLoading: false }) },
      getSession: { useQuery: () => ({ data: undefined, isLoading: false }) },
      createSession: { useMutation: () => ({ mutate: mocks.createSession, isPending: false }) },
      createTrade: { useMutation: () => ({ mutate: vi.fn(), isPending: false }) },
      archiveSession: { useMutation: () => ({ mutate: vi.fn(), isPending: false }) },
      reopenSession: { useMutation: () => ({ mutate: mocks.reopenSession, isPending: false }) },
      deleteTrade: { useMutation: () => ({ mutate: vi.fn(), isPending: false }) },
    },
  },
}));

import Backtest from "./Backtest";

describe("Backtest workspace", () => {
  afterEach(cleanup);

  it("clearly separates simulated strategy work from the live journal", () => {
    render(<Backtest />);
    expect(screen.getByText("Backtest Workspace")).toBeTruthy();
    expect(screen.getByText(/Simulated only/)).toBeTruthy();
    expect(screen.getByText(/never affect your live journal statistics/)).toBeTruthy();
  });

  it("creates a private strategy session from the workspace form", async () => {
    const user = userEvent.setup();
    render(<Backtest />);
    await user.click(screen.getByText("New strategy session"));
    await user.type(screen.getByLabelText("Strategy name"), "NY open continuation");
    await user.type(screen.getByLabelText("Symbol"), "EURUSD");
    await user.click(screen.getByText("Create private Backtest session"));
    expect(mocks.createSession).toHaveBeenCalledWith(expect.objectContaining({ strategyName: "NY open continuation", symbol: "EURUSD" }));
  });
});
