// @vitest-environment jsdom
import React from "react";
import { cleanup, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({ invalidate: vi.fn(), upload: vi.fn(), remove: vi.fn(), updateName: vi.fn() }));

vi.mock("@/_core/hooks/useAuth", () => ({ useAuth: () => ({ user: { name: "Avery Trader" } }) }));
vi.mock("@/lib/trpc", () => ({
  trpc: {
    useUtils: () => ({ account: { profile: { invalidate: mocks.invalidate } } }),
    account: {
      profile: { useQuery: () => ({ data: { name: "Avery Trader", email: "avery@example.com", role: "user", avatarUrl: "/manus-storage/account-avatars/7/photo.webp", customAvatarUrl: "/manus-storage/account-avatars/7/photo.webp" } }) },
      uploadProfilePhoto: { useMutation: () => ({ mutate: mocks.upload, isPending: false }) },
      removeProfilePhoto: { useMutation: () => ({ mutate: mocks.remove, isPending: false }) },
      updateDisplayName: { useMutation: () => ({ mutate: mocks.updateName, isPending: false }) },
    },
  },
}));

import Account from "./Account";

describe("Account custom profile photo", () => {
  afterEach(cleanup);

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
});
