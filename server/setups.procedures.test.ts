import { beforeEach, describe, expect, it, vi } from "vitest";

const databaseMocks = vi.hoisted(() => ({ getDb: vi.fn() }));
vi.mock("./db", () => ({ getDb: databaseMocks.getDb }));

import { setupsRouter } from "./setups";

function callerFor(userId: number) {
  return setupsRouter.createCaller({ user: { id: userId } } as never);
}

describe("Saved Setups protected management", () => {
  beforeEach(() => databaseMocks.getDb.mockReset());

  it("rejects editing a setup that is not owned by the current member", async () => {
    const where = vi.fn(async () => []);
    databaseMocks.getDb.mockResolvedValue({ select: vi.fn(() => ({ from: vi.fn(() => ({ where })) })) });

    await expect(callerFor(7).update({ id: 41, name: "Other member setup" })).rejects.toMatchObject({ code: "NOT_FOUND" });
  });

  it("normalizes an owned edited setup and preserves its member ownership", async () => {
    const where = vi.fn().mockResolvedValueOnce([{ id: 7, userId: 3, name: "London Breakout" }]).mockResolvedValueOnce([]);
    const from = vi.fn(() => ({ where }));
    const returning = vi.fn(async () => [{ id: 7, userId: 3, name: "London continuation", slug: "london-continuation" }]);
    const updateWhere = vi.fn(() => ({ returning }));
    const set = vi.fn(() => ({ where: updateWhere }));
    databaseMocks.getDb.mockResolvedValue({ select: vi.fn(() => ({ from })), update: vi.fn(() => ({ set })) });

    const result = await callerFor(3).update({ id: 7, name: "London continuation", description: "Wait for retest" });

    expect(set).toHaveBeenCalledWith(expect.objectContaining({ name: "London continuation", slug: "london-continuation", description: "Wait for retest" }));
    expect(result).toMatchObject({ id: 7, userId: 3, slug: "london-continuation" });
  });

  it("restores an archived setup only after confirming member ownership", async () => {
    const where = vi.fn(async () => [{ id: 8, userId: 3, isArchived: true }]);
    const from = vi.fn(() => ({ where }));
    const returning = vi.fn(async () => [{ id: 8, userId: 3, isArchived: false }]);
    const updateWhere = vi.fn(() => ({ returning }));
    const set = vi.fn(() => ({ where: updateWhere }));
    databaseMocks.getDb.mockResolvedValue({ select: vi.fn(() => ({ from })), update: vi.fn(() => ({ set })) });

    const result = await callerFor(3).archive({ id: 8, isArchived: false });

    expect(set).toHaveBeenCalledWith(expect.objectContaining({ isArchived: false }));
    expect(result).toMatchObject({ id: 8, isArchived: false });
  });
});
