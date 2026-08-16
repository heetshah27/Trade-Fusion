// @vitest-environment jsdom
import React from "react";
import { describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";

const queryState = {
  data: undefined as unknown,
  isLoading: false,
  isFetching: false,
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

describe("Market Calendar coverage states", () => {
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
});
