// @vitest-environment jsdom
import React from "react";
import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({ invalidate: vi.fn(), upload: vi.fn(), remove: vi.fn() }));

vi.mock("@/_core/hooks/useAuth", () => ({ useAuth: () => ({ user: { name: "Avery Trader" } }) }));
vi.mock("@/lib/trpc", () => ({
  trpc: {
    useUtils: () => ({ account: { profile: { invalidate: mocks.invalidate } } }),
    account: {
      profile: { useQuery: () => ({ data: { name: "Avery Trader", email: "avery@example.com", role: "user", avatarUrl: "/manus-storage/account-avatars/7/photo.webp", customAvatarUrl: "/manus-storage/account-avatars/7/photo.webp" } }) },
      uploadProfilePhoto: { useMutation: () => ({ mutate: mocks.upload, isPending: false }) },
      removeProfilePhoto: { useMutation: () => ({ mutate: mocks.remove, isPending: false }) },
    },
  },
}));

import Account from "./Account";

describe("Account custom profile photo", () => {
  it("shows replacement and email-avatar fallback controls when a custom photo exists", () => {
    render(<Account />);
    expect(screen.getByText("Replace photo")).toBeTruthy();
    expect(screen.getByText("Use email avatar")).toBeTruthy();
    expect(screen.getByText(/JPG, PNG, or WebP up to 2 MB/)).toBeTruthy();
    expect(screen.getByText("Profile photo fallback")).toBeTruthy();
  });
});
