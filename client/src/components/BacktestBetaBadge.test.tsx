// @vitest-environment jsdom
import React from "react";
import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { BacktestBetaBadge } from "./BacktestBetaBadge";

describe("BacktestBetaBadge", () => {
  it("renders an explicit beta status marker", () => {
    render(<BacktestBetaBadge />);
    expect(screen.getByTitle(/backtest is in active beta/i).textContent).toBe("BETA");
  });
});
