// @vitest-environment jsdom
import React from "react";
import { cleanup, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it, vi } from "vitest";

import AddTradeModal from "./AddTradeModal";

describe("AddTradeModal structured manual logging", () => {
  afterEach(cleanup);

  it("saves a core manual trade without exposing the optional contextual tagging controls", async () => {
    const user = userEvent.setup();
    const onSave = vi.fn();
    render(<AddTradeModal open onClose={vi.fn()} onSave={onSave} />);

    await user.type(screen.getByPlaceholderText(/aapl, btc/i), "XAUUSD");
    await user.click(screen.getByRole("button", { name: /log trade/i }));

    expect(onSave).toHaveBeenCalledWith(expect.objectContaining({
      symbol: "XAUUSD",
      setupId: null,
      setupTag: "",
      marketSession: "",
      instrumentCategory: "",
      tradeQuality: "",
      ruleFollowed: null,
    }));
    expect(screen.queryByLabelText("Saved setup")).toBeNull();
    expect(screen.queryByLabelText("New setup name")).toBeNull();
    expect(screen.queryByText(/market session/i)).toBeNull();
    expect(screen.queryByLabelText("Instrument category")).toBeNull();
    expect(screen.queryByLabelText("Trade quality")).toBeNull();
    expect(screen.queryByLabelText("Rule followed")).toBeNull();
  });

  it("selects a visual instrument while retaining the custom symbol field without showing category controls", async () => {
    const user = userEvent.setup();
    const onSave = vi.fn();
    render(<AddTradeModal open onClose={vi.fn()} onSave={onSave} />);

    await user.click(screen.getByRole("button", { name: /choose an instrument/i }));
    await user.click(screen.getByRole("option", { name: /xauusd/i }));

    expect((screen.getByLabelText("Custom instrument symbol") as HTMLInputElement).value).toBe("XAUUSD");
    expect(screen.queryByLabelText("Instrument category")).toBeNull();
    await user.click(screen.getByRole("button", { name: /log trade/i }));
    expect(onSave).toHaveBeenCalledWith(expect.objectContaining({ symbol: "XAUUSD", instrumentCategory: "" }));
  });

  it("renders the streamlined core trade controls at desktop and mobile viewport widths", () => {
    for (const [width, height] of [[1280, 720], [375, 812]]) {
      Object.defineProperty(window, "innerWidth", { configurable: true, value: width });
      Object.defineProperty(window, "innerHeight", { configurable: true, value: height });
      window.dispatchEvent(new Event("resize"));

      const { unmount } = render(<AddTradeModal open onClose={vi.fn()} onSave={vi.fn()} />);
      expect(screen.getByRole("dialog")).toBeTruthy();
      expect(screen.getByLabelText("Custom instrument symbol")).toBeTruthy();
      expect(screen.getByText("Assisted P&L (auto)")).toBeTruthy();
      expect(screen.getByText("Notes")).toBeTruthy();
      expect(screen.queryByLabelText("Saved setup")).toBeNull();
      expect(screen.queryByLabelText("Instrument category")).toBeNull();
      expect(screen.queryByLabelText("Trade quality")).toBeNull();
      expect(screen.queryByLabelText("Rule followed")).toBeNull();
      unmount();
    }
  });

  it("finds instruments from smart trading aliases in the visual picker", async () => {
    const user = userEvent.setup();
    render(<AddTradeModal open onClose={vi.fn()} onSave={vi.fn()} />);

    await user.click(screen.getByRole("button", { name: /choose an instrument/i }));
    await user.type(screen.getByLabelText("Search instruments"), "gold");

    expect(screen.getByRole("option", { name: /xauusd/i })).toBeTruthy();
    expect(screen.queryByRole("option", { name: /btcusd/i })).toBeNull();
  });
});
