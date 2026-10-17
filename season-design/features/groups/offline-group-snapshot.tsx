"use client";

import { useEffect, useState } from "react";
import { putOfflineSnapshot } from "@/lib/offline/read-cache";

export type OfflineGroupSummary = {
  id: string;
  name: string;
  ageGradeLabel: string;
  typicalPlayerCount: number;
  generalLevel: string;
};

type OfflineGroupSource = OfflineGroupSummary & {
  notes?: string;
};

const LAST_GROUP_PREFIX = "season-design:last-group:";

export function toOfflineGroupSummary(group: OfflineGroupSource): OfflineGroupSummary {
  return {
    id: group.id,
    name: group.name,
    ageGradeLabel: group.ageGradeLabel,
    typicalPlayerCount: group.typicalPlayerCount,
    generalLevel: group.generalLevel,
  };
}

export function OfflineGroupSnapshot({
  userId,
  group,
  updatedAt,
}: {
  userId: string;
  group: OfflineGroupSource;
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
    const summary = toOfflineGroupSummary(group);
    void putOfflineSnapshot(`${userId}:group:${group.id}`, summary, updatedAt).then(() => {
      window.localStorage.setItem(`${LAST_GROUP_PREFIX}${userId}`, group.id);
    });
  }, [group, updatedAt, userId]);

  if (!offline) return null;
  return <p className="offlineBadge">מצב לא מקוון · מוצג המידע האחרון שנשמר במכשיר</p>;
}

export function getLastGroupStorageKey(userId: string) {
  return `${LAST_GROUP_PREFIX}${userId}`;
}
