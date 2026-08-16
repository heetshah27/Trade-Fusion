// @vitest-environment jsdom
import React from "react";
import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { DirectionBadge } from "./DirectionBadge";

describe("DirectionBadge", () => {
  it("renders an accessible Long badge with an upward trend symbol", () => {
    render(<DirectionBadge direction="LONG" />);
    expect(screen.getByRole("img", { name: "Long direction" }).textContent).toContain("Long");
  });

  it("renders an accessible Short badge with a downward trend symbol", () => {
    render(<DirectionBadge direction="SHORT" />);
    expect(screen.getByRole("img", { name: "Short direction" }).textContent).toContain("Short");
  });
});
