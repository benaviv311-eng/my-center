"use client";

import { useEffect, useState } from "react";
import { putOfflineSnapshot } from "@/lib/offline/read-cache";

export type OfflineGroupSummary = {
  id: string;
  name: string;
  ageGradeLabel: string;
  typicalPlayerCount: number;
  generalLevel: string;
  notes: string;
};

const LAST_GROUP_PREFIX = "season-design:last-group:";

export function OfflineGroupSnapshot({
  userId,
  group,
  updatedAt,
}: {
  userId: string;
  group: OfflineGroupSummary;
  updatedAt: string;
}) {
  const [offline, setOffline] = useState(false);

  useEffect(() => {
    const syncStatus = () => setOffline(!navigator.onLine);
    syncStatus();
    window.addEventListener("online", syncStatus);
    window.addEventListener("offline", syncStatus);
    return () => {
      window.removeEventListener("online", syncStatus);
      window.removeEventListener("offline", syncStatus);
    };
  }, []);

  useEffect(() => {
    void putOfflineSnapshot(`${userId}:group:${group.id}`, group, updatedAt).then(() => {
      window.localStorage.setItem(`${LAST_GROUP_PREFIX}${userId}`, group.id);
    });
  }, [group, updatedAt, userId]);

  if (!offline) return null;
  return <p className="offlineBadge">מצב לא מקוון · מוצג המידע האחרון שנשמר במכשיר</p>;
}

export function getLastGroupStorageKey(userId: string) {
  return `${LAST_GROUP_PREFIX}${userId}`;
}
