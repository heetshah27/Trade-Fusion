import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  getDb: vi.fn(),
  storagePut: vi.fn(),
}));

vi.mock("./db", () => ({ getDb: mocks.getDb }));
vi.mock("./storage", () => ({ storagePut: mocks.storagePut }));

import { communityRouter } from "./community";

function queuedSelect(results: unknown[][]) {
  return vi.fn(() => ({
    from: vi.fn(() => ({
      where: vi.fn(async () => results.shift() ?? []),
    })),
  }));
}

function caller(userId = 7) {
  return communityRouter.createCaller({
    user: { id: userId, role: "user", tradingStyle: null },
  } as never);
}

describe("Trader’s Room enhancement procedures", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.storagePut.mockResolvedValue({ key: "community/7/posts/12/image.png", url: "/manus-storage/community-image" });
  });

  it("rejects an attachment from a member who does not own the discussion", async () => {
    const db = { select: queuedSelect([[{ authorId: 8, status: "active" }]]) };
    mocks.getDb.mockResolvedValue(db);

    await expect(caller().uploadAttachment({
      postId: 12,
      fileName: "chart.png",
      mimeType: "image/png",
      dataUrl: "data:image/png;base64,aGVsbG8taGVsbG8taGVsbG8taGVsbG8=",
    })).rejects.toThrow("Only the discussion author can add attachments");
    expect(mocks.storagePut).not.toHaveBeenCalled();
  });

  it("enforces the two-image limit before storing a new attachment", async () => {
    const transactionSelect = queuedSelect([[{ id: 1 }, { id: 2 }]]);
    const tx = { execute: vi.fn(), select: transactionSelect };
    const db = {
      select: queuedSelect([[{ authorId: 7, status: "active" }]]),
      transaction: vi.fn(async (callback: (transaction: typeof tx) => unknown) => callback(tx)),
    };
    mocks.getDb.mockResolvedValue(db);

    await expect(caller().uploadAttachment({
      postId: 12,
      fileName: "chart.png",
      mimeType: "image/png",
      dataUrl: "data:image/png;base64,aGVsbG8taGVsbG8taGVsbG8taGVsbG8=",
    })).rejects.toThrow("up to two images");
    expect(tx.execute).toHaveBeenCalledTimes(1);
    expect(mocks.storagePut).not.toHaveBeenCalled();
  });

  it("stores an allowed attachment only after acquiring the post-level lock", async () => {
    const returning = vi.fn(async () => [{ id: 9, url: "/manus-storage/community-image" }]);
    const tx = {
      execute: vi.fn(),
      select: queuedSelect([[]]),
      insert: vi.fn(() => ({ values: vi.fn(() => ({ returning })) })),
    };
    const db = {
      select: queuedSelect([[{ authorId: 7, status: "active" }]]),
      transaction: vi.fn(async (callback: (transaction: typeof tx) => unknown) => callback(tx)),
    };
    mocks.getDb.mockResolvedValue(db);

    await expect(caller().uploadAttachment({
      postId: 12,
      fileName: "chart.png",
      mimeType: "image/png",
      dataUrl: "data:image/png;base64,aGVsbG8taGVsbG8taGVsbG8taGVsbG8=",
    })).resolves.toMatchObject({ id: 9 });
    expect(tx.execute).toHaveBeenCalledTimes(1);
    expect(mocks.storagePut).toHaveBeenCalledTimes(1);
    expect(tx.insert).toHaveBeenCalledTimes(1);
  });

  it.each([
    ["reactToPost", { postId: 12, reaction: "insightful" }],
    ["reactToComment", { commentId: 24, reaction: "support" }],
  ] as const)("upserts a changed or new %s reaction through its unique index", async (method, input) => {
    const onConflictDoUpdate = vi.fn();
    const db = {
      select: queuedSelect([[{ id: 1 }], [{ id: 2, reaction: "question" }]]),
      insert: vi.fn(() => ({ values: vi.fn(() => ({ onConflictDoUpdate })) })),
    };
    mocks.getDb.mockResolvedValue(db);

    await expect(caller()[method](input as never)).resolves.toEqual({ reaction: input.reaction });
    expect(onConflictDoUpdate).toHaveBeenCalledTimes(1);
  });

  it("deletes an identical post reaction to toggle it off", async () => {
    const where = vi.fn();
    const db = {
      select: queuedSelect([[{ id: 12 }], [{ id: 4, reaction: "insightful" }]]),
      delete: vi.fn(() => ({ where })),
    };
    mocks.getDb.mockResolvedValue(db);

    await expect(caller().reactToPost({ postId: 12, reaction: "insightful" })).resolves.toEqual({ reaction: null });
    expect(db.delete).toHaveBeenCalledTimes(1);
    expect(where).toHaveBeenCalledTimes(1);
  });
});
