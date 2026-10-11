import "fake-indexeddb/auto";
import { beforeEach, describe, expect, it } from "vitest";
import { deleteDB } from "idb";
import { getOfflineSnapshot, putOfflineSnapshot } from "./read-cache";

const DB_NAME = "season-design-offline";

beforeEach(async () => {
  await deleteDB(DB_NAME);
});

describe("offline read cache", () => {
  it("stores and reads a snapshot with its timestamp", async () => {
    await putOfflineSnapshot("coach-a:group:1", { name: "ז׳ מצוינות" }, "2026-10-11T08:00:00.000Z");

    await expect(getOfflineSnapshot<{ name: string }>("coach-a:group:1")).resolves.toEqual({
      value: { name: "ז׳ מצוינות" },
      updatedAt: "2026-10-11T08:00:00.000Z",
    });
  });

  it("returns null for a missing key", async () => {
    await expect(getOfflineSnapshot("coach-a:missing")).resolves.toBeNull();
  });

  it("replaces an older snapshot for the same key", async () => {
    await putOfflineSnapshot("coach-a:group:1", { count: 10 }, "2026-10-11T08:00:00.000Z");
    await putOfflineSnapshot("coach-a:group:1", { count: 12 }, "2026-10-11T09:00:00.000Z");

    await expect(getOfflineSnapshot<{ count: number }>("coach-a:group:1")).resolves.toEqual({
      value: { count: 12 },
      updatedAt: "2026-10-11T09:00:00.000Z",
    });
  });

  it("keeps snapshots isolated by user namespace", async () => {
    await putOfflineSnapshot("coach-a:group:1", { name: "A" }, "2026-10-11T08:00:00.000Z");
    await putOfflineSnapshot("coach-b:group:1", { name: "B" }, "2026-10-11T08:00:00.000Z");

    expect((await getOfflineSnapshot<{ name: string }>("coach-a:group:1"))?.value.name).toBe("A");
    expect((await getOfflineSnapshot<{ name: string }>("coach-b:group:1"))?.value.name).toBe("B");
  });
});
