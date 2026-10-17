"use client";

import { useEffect, useState } from "react";
import {
  getLastGroupStorageKey,
  type OfflineGroupSummary,
} from "@/features/groups/offline-group-snapshot";
import { ACTIVE_USER_STORAGE_KEY } from "@/lib/offline/identity-bridge";
import { getOfflineSnapshot } from "@/lib/offline/read-cache";

export default function OfflinePage() {
  const [cachedGroup, setCachedGroup] = useState<{
    value: OfflineGroupSummary;
    updatedAt: string;
  } | null>(null);

  useEffect(() => {
    const userId = window.localStorage.getItem(ACTIVE_USER_STORAGE_KEY);
    if (!userId) return;
    const groupId = window.localStorage.getItem(getLastGroupStorageKey(userId));
    if (!groupId) return;
    void getOfflineSnapshot<OfflineGroupSummary>(`${userId}:group:${groupId}`).then(setCachedGroup);
  }, []);

  return (
    <main className="offlinePage">
      <div className="panel pageStack">
        <div>
          <p className="eyebrow">אין כרגע חיבור</p>
          <h1>SeasonDesign במצב לא מקוון</h1>
          <p>
            אפשר להמשיך לצפות במידע שכבר נטען ונשמר במכשיר. יצירה ושמירה של מידע חדש יחזרו כשיהיה חיבור.
          </p>
        </div>

        {cachedGroup ? (
          <section className="cachedOfflineCard" aria-label="מידע אחרון שנשמר">
            <p className="eyebrow">הקבוצה האחרונה שנצפתה</p>
            <h2>{cachedGroup.value.name}</h2>
            <p>
              {cachedGroup.value.ageGradeLabel || "קבוצה"} · {cachedGroup.value.typicalPlayerCount} שחקנים · רמה {cachedGroup.value.generalLevel}
            </p>
            <small>המידע נשמר ב־{new Date(cachedGroup.updatedAt).toLocaleString("he-IL")}</small>
          </section>
        ) : (
          <p className="mutedText">אין במכשיר כרגע פרטי קבוצה שניתן להציג בבטחה.</p>
        )}
      </div>
    </main>
  );
}
