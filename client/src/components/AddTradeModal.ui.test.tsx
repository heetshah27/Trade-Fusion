// @vitest-environment jsdom
import React from "react";
import { cleanup, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it, vi } from "vitest";

const invalidateSetups = vi.fn();
const createSetup = vi.fn();

vi.mock("@/lib/trpc", () => ({
  trpc: {
    useUtils: () => ({ setups: { list: { invalidate: invalidateSetups } } }),
    setups: {
      list: { useQuery: () => ({ data: [{ id: 14, name: "London Breakout", isArchived: false }], isLoading: false }) },
      create: { useMutation: () => ({ mutate: createSetup, isPending: false, error: null }) },
    },
  },
}));

import AddTradeModal from "./AddTradeModal";

describe("AddTradeModal structured manual logging", () => {
  afterEach(() => { cleanup(); createSetup.mockReset(); invalidateSetups.mockReset(); });

  it("saves the selected private setup and contextual trade tags with a manual journal entry", async () => {
    const user = userEvent.setup();
    const onSave = vi.fn();
    render(<AddTradeModal open onClose={vi.fn()} onSave={onSave} />);

    await user.type(screen.getByPlaceholderText(/aapl, btc/i), "XAUUSD");
    await user.selectOptions(screen.getByLabelText("Saved setup"), "14");
    await user.selectOptions(screen.getByLabelText("Instrument category"), "metals");
    await user.selectOptions(screen.getByLabelText("Trade quality"), "A_PLUS");
    await user.selectOptions(screen.getByLabelText("Rule followed"), "yes");
    await user.click(screen.getByRole("button", { name: /log trade/i }));

    expect(onSave).toHaveBeenCalledWith(expect.objectContaining({
      symbol: "XAUUSD",
      setupId: 14,
      setupTag: "London Breakout",
      instrumentCategory: "metals",
      tradeQuality: "A_PLUS",
      ruleFollowed: true,
    }));
  });

  it("offers inline creation for a new private setup without leaving the journal form", async () => {
    const user = userEvent.setup();
    render(<AddTradeModal open onClose={vi.fn()} onSave={vi.fn()} />);

    await user.type(screen.getByLabelText("New setup name"), "New York reversal");
    await user.click(screen.getByRole("button", { name: /\+ add/i }));

    expect(createSetup).toHaveBeenCalledWith({ name: "New York reversal" });
  });
});
