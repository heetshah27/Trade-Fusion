// @vitest-environment jsdom
import React from "react";
import { cleanup, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({ invalidate: vi.fn(), setupsInvalidate: vi.fn(), upload: vi.fn(), remove: vi.fn(), updateName: vi.fn(), createSetup: vi.fn(), updateSetup: vi.fn(), archiveSetup: vi.fn(), checkout: vi.fn() }));

vi.mock("@/_core/hooks/useAuth", () => ({ useAuth: () => ({ user: { name: "Avery Trader" } }) }));
vi.mock("@/lib/trpc", () => ({
  trpc: {
    useUtils: () => ({ account: { profile: { invalidate: mocks.invalidate } }, setups: { list: { invalidate: mocks.setupsInvalidate } } }),
    account: {
      profile: { useQuery: () => ({ data: { name: "Avery Trader", email: "avery@example.com", role: "user", avatarUrl: "/manus-storage/account-avatars/7/photo.webp", customAvatarUrl: "/manus-storage/account-avatars/7/photo.webp" } }) },
      uploadProfilePhoto: { useMutation: () => ({ mutate: mocks.upload, isPending: false }) },
      removeProfilePhoto: { useMutation: () => ({ mutate: mocks.remove, isPending: false }) },
      updateDisplayName: { useMutation: () => ({ mutate: mocks.updateName, isPending: false }) },
    },
    setups: {
      list: { useQuery: () => ({ data: [{ id: 7, name: "London Breakout", description: "Break and retest", isArchived: false }, { id: 8, name: "Old setup", description: null, isArchived: true }], isLoading: false }) },
      create: { useMutation: () => ({ mutate: mocks.createSetup, isPending: false, error: null }) },
      update: { useMutation: () => ({ mutate: mocks.updateSetup, isPending: false, error: null }) },
      archive: { useMutation: () => ({ mutate: mocks.archiveSetup, isPending: false, error: null }) },
    },
    billing: {
      status: { useQuery: () => ({ data: { tier: "free", backtestAccess: "locked", billingReady: true, usage: { trades: { used: 2, limit: 15, remaining: 13 }, threads: { used: 1, limit: 10, remaining: 9 } } }, isLoading: false }) },
      history: { useQuery: () => ({ data: [] }) },
      createCheckout: { useMutation: () => ({ mutate: mocks.checkout, isPending: false }) },
      createPortal: { useMutation: () => ({ mutate: vi.fn(), isPending: false }) },
    },
  },
}));

import Account from "./Account";

describe("Account custom profile photo", () => {
  afterEach(() => { cleanup(); Object.values(mocks).forEach(mock => mock.mockReset()); });

  it("shows replacement and email-avatar fallback controls when a custom photo exists", () => {
    render(<Account />);
    expect(screen.getByText("Replace photo")).toBeTruthy();
    expect(screen.getByText("Use email avatar")).toBeTruthy();
    expect(screen.getByText(/JPG, PNG, or WebP up to 10 MB/)).toBeTruthy();
    expect(screen.getByText("Profile photo fallback")).toBeTruthy();
  });

  it("lets a member open display-name editing and submit a new visible name", async () => {
    const user = userEvent.setup();
    render(<Account />);
    await user.click(screen.getByLabelText("Edit display name"));
    const input = screen.getByLabelText("Display name");
    await user.clear(input);
    await user.type(input, "Avery Markets");
    await user.click(screen.getByLabelText("Save display name"));
    expect(mocks.updateName).toHaveBeenCalledWith({ displayName: "Avery Markets" });
  });

  it("manages private active and archived setup definitions from Account", async () => {
    const user = userEvent.setup();
    render(<Account />);
    expect(screen.getByText("Saved setups")).toBeTruthy();
    expect(screen.getByText("London Breakout")).toBeTruthy();
    expect(screen.getByText("Old setup")).toBeTruthy();

    await user.click(screen.getByRole("button", { name: /new setup/i }));
    await user.type(screen.getByLabelText("New saved setup name"), "New York reversal");
    await user.click(screen.getByRole("button", { name: /^save$/i }));
    expect(mocks.createSetup).toHaveBeenCalledWith({ name: "New York reversal", description: "" });

    await user.click(screen.getByLabelText("Archive London Breakout"));
    expect(mocks.archiveSetup).toHaveBeenCalledWith({ id: 7, isArchived: true });
    await user.click(screen.getByLabelText("Restore Old setup"));
    expect(mocks.archiveSetup).toHaveBeenCalledWith({ id: 8, isArchived: false });
  });

  it("edits an active private setup without exposing another member's setup controls", async () => {
    const user = userEvent.setup();
    render(<Account />);
    await user.click(screen.getByLabelText("Edit London Breakout"));
    const name = screen.getByLabelText("Edit setup name");
    await user.clear(name);
    await user.type(name, "London continuation");
    await user.click(screen.getByLabelText("Save setup edits"));
    expect(mocks.updateSetup).toHaveBeenCalledWith({ id: 7, name: "London continuation", description: "Break and retest" });
  });

  it("shows immediate accessible feedback while secure checkout is being prepared", async () => {
    const user = userEvent.setup();
    render(<Account />);
    await user.click(screen.getByRole("button", { name: /start 7-day pro trial/i }));
    expect(mocks.checkout).toHaveBeenCalledTimes(1);
    expect(screen.getByRole("status").textContent).toContain("Preparing secure Stripe Checkout");
  });

  it("places concise billing answers alongside the Pro checkout decision", async () => {
    const user = userEvent.setup();
    render(<Account />);
    expect(screen.getByRole("heading", { name: "Before you start" })).toBeTruthy();
    await user.click(screen.getByRole("button", { name: "What happens after the 7-day trial?" }));
    expect(screen.getByText(/renews at \$10 USD per month/i)).toBeTruthy();
  });
});
