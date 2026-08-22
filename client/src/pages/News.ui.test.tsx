// @vitest-environment jsdom
import React from "react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { cleanup, render, screen } from "@testing-library/react";

const queryState = {
  data: undefined as unknown,
  isLoading: false,
  isFetching: false,
  isError: false,
  error: null as unknown,
  refetch: vi.fn(),
};

vi.mock("@/lib/trpc", () => ({
  trpc: {
    calendar: {
      getEvents: {
        useQuery: () => queryState,
      },
    },
  },
}));

import News from "./News";

function liveCalendarResponse() {
  return {
    sourceStatus: "live" as const,
    refreshedAt: "2026-08-21T15:00:00.000Z",
    coverageStart: "2026-08-16",
    coverageEnd: "2026-08-21",
    events: [{
      id: "usd-pmi",
      date: "2026-08-21",
      time: "9:45am",
      country: "USD",
      event: "Flash Manufacturing PMI",
      impact: "medium" as const,
      forecast: "53.9",
      previous: "53.8",
    }],
  };
}

function renderLiveCalendarAt(width: number, height: number) {
  Object.defineProperty(window, "innerWidth", { configurable: true, value: width });
  Object.defineProperty(window, "innerHeight", { configurable: true, value: height });
  window.dispatchEvent(new Event("resize"));
  queryState.data = liveCalendarResponse();
  return render(<News />);
}

describe("Market Calendar coverage states", () => {
  afterEach(() => {
    cleanup();
    queryState.data = undefined;
    queryState.isLoading = false;
    queryState.isFetching = false;
    queryState.isError = false;
    queryState.error = null;
    queryState.refetch.mockReset();
  });

  it("warns clearly when a high-impact filter is operating on stale source coverage", () => {
    queryState.data = {
      sourceStatus: "stale",
      refreshedAt: "2026-08-16T01:00:00.000Z",
      coverageStart: "2026-08-09",
      coverageEnd: "2026-08-14",
      message: "ForexFactory's weekly export currently ends 2026-08-14.",
      events: [
        {
          id: "cpi",
          date: "2026-08-12",
          time: "8:30am",
          country: "USD",
          event: "Core CPI y/y",
          impact: "high",
        },
      ],
    };

    render(<News />);

    expect(screen.getByRole("status").textContent).toContain("Upcoming coverage is waiting on the source export");
    expect(screen.getByText(/Coverage · Aug 9 – Aug 14 · delayed source/i)).toBeTruthy();
    expect(screen.getByText("Core CPI y/y")).toBeTruthy();
  });

  it("shows a visible retry state when the live calendar query fails without cached events", () => {
    queryState.isError = true;
    queryState.error = new Error("Calendar request timed out");

    render(<News />);

    expect(screen.getByRole("alert").textContent).toContain("Live calendar update could not finish");
    expect(screen.getByText("Calendar request timed out")).toBeTruthy();
    expect(screen.getByRole("button", { name: "Try again" })).toBeTruthy();
  });

  it("renders a current source event card with coverage and Eastern Time labels on desktop", () => {
    renderLiveCalendarAt(1280, 720);

    expect(screen.getByText(/Coverage · Aug 16 – Aug 21/i)).toBeTruthy();
    expect(screen.getByTestId("calendar-event-usd-pmi")).toBeTruthy();
    expect(screen.getByText("Flash Manufacturing PMI")).toBeTruthy();
    expect(screen.getByText("Aug 21, 2026")).toBeTruthy();
    expect(screen.getByText("9:45 AM")).toBeTruthy();
    expect(screen.getByLabelText("United States flag")).toBeTruthy();
  });

  it("renders the same current source event card and Eastern Time label on mobile", () => {
    renderLiveCalendarAt(375, 812);

    expect(screen.getByTestId("calendar-event-usd-pmi")).toBeTruthy();
    expect(screen.getByText("Flash Manufacturing PMI")).toBeTruthy();
    expect(screen.getByText("9:45 AM")).toBeTruthy();
    expect(screen.getByLabelText("United States flag")).toBeTruthy();
  });
});
