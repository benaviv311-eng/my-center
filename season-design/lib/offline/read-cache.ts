import { openDB } from "idb";

const DB_NAME = "season-design-offline";
const STORE_NAME = "read-snapshots";
const DB_VERSION = 1;

type SnapshotRecord<T> = {
  key: string;
  value: T;
  updatedAt: string;
};

async function getDb() {
  return openDB(DB_NAME, DB_VERSION, {
    upgrade(db) {
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME, { keyPath: "key" });
      }
    },
  });
}

export async function putOfflineSnapshot<T>(
  key: string,
  value: T,
  updatedAt: string,
): Promise<void> {
  const db = await getDb();
  await db.put(STORE_NAME, { key, value, updatedAt } satisfies SnapshotRecord<T>);
}

export async function getOfflineSnapshot<T>(
  key: string,
): Promise<{ value: T; updatedAt: string } | null> {
  const db = await getDb();
  const record = (await db.get(STORE_NAME, key)) as SnapshotRecord<T> | undefined;
  if (!record) return null;
  return { value: record.value, updatedAt: record.updatedAt };
}
