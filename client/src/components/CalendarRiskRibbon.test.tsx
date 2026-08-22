// @vitest-environment jsdom
import React from "react";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { CalendarRiskRibbon } from "./CalendarRiskRibbon";

describe("CalendarRiskRibbon", () => {
  afterEach(() => cleanup());

  it("uses a visible retry state rather than treating a failed calendar query as no risk", () => {
    const retry = vi.fn();
    render(<CalendarRiskRibbon isLoading={false} isError error={new Error("Calendar request timed out")} onRetry={retry} onOpenCalendar={vi.fn()} />);

    expect(screen.getByRole("alert").textContent).toContain("Live calendar risk is unavailable");
    fireEvent.click(screen.getByRole("button", { name: /try again/i }));
    expect(retry).toHaveBeenCalledTimes(1);
  });

  it("states clearly when no high-impact events remain today", () => {
    render(<CalendarRiskRibbon isLoading={false} calendar={{ sourceStatus: "live", events: [{ id: "low-event", date: "2026-08-21", time: "9:00am", country: "USD", event: "Low impact release", impact: "low" }] }} onOpenCalendar={vi.fn()} />);

    expect(screen.getByTestId("dashboard-calendar-risk").textContent).toContain("No high-impact events remain today.");
  });
});
