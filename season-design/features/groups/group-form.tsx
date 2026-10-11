"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { createGroupAction, updateGroupAction } from "./actions";
import type { Group, SkillLevel } from "./types";

const levelOptions: Array<{ value: SkillLevel; label: string }> = [
  { value: "beginner", label: "מתחילים" },
  { value: "basic", label: "בסיסי" },
  { value: "intermediate", label: "בינוני" },
  { value: "advanced", label: "מתקדם" },
  { value: "competitive", label: "תחרותי" },
];

export function GroupForm({ group }: { group?: Group }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  return (
    <form
      className="panel formStack"
      action={(formData) => {
        setError(null);
        startTransition(async () => {
          try {
            const input = {
              name: String(formData.get("name") ?? ""),
              ageCategory: String(formData.get("ageCategory") ?? "middle_school") as Group["ageCategory"],
              ageGradeLabel: String(formData.get("ageGradeLabel") ?? ""),
              typicalPlayerCount: Number(formData.get("typicalPlayerCount")),
              generalLevel: String(formData.get("generalLevel") ?? "basic") as SkillLevel,
              notes: String(formData.get("notes") ?? ""),
              recurringConstraints: {},
            };

            const saved = group
              ? await updateGroupAction(group.id, input)
              : await createGroupAction(input);
            router.push(`/groups/${saved.id}`);
            router.refresh();
          } catch (cause) {
            setError(cause instanceof Error ? cause.message : "לא ניתן לשמור את הקבוצה");
          }
        });
      }}
    >
      <label>
        <span>שם הקבוצה</span>
        <input name="name" required defaultValue={group?.name ?? ""} placeholder="למשל ז׳ מצוינות" />
      </label>

      <div className="formGrid">
        <label>
          <span>קטגוריית גיל</span>
          <select name="ageCategory" defaultValue={group?.ageCategory ?? "middle_school"}>
            <option value="elementary">יסודי</option>
            <option value="middle_school">חטיבה</option>
            <option value="high_school">תיכון</option>
            <option value="adults">בוגרים</option>
          </select>
        </label>
        <label>
          <span>כיתה / גיל</span>
          <input name="ageGradeLabel" defaultValue={group?.ageGradeLabel ?? ""} placeholder="כיתה ז׳" />
        </label>
      </div>

      <div className="formGrid">
        <label>
          <span>מספר שחקנים טיפוסי</span>
          <input name="typicalPlayerCount" type="number" min="1" required defaultValue={group?.typicalPlayerCount ?? 12} />
        </label>
        <label>
          <span>רמה כללית</span>
          <select name="generalLevel" defaultValue={group?.generalLevel ?? "basic"}>
            {levelOptions.map((option) => (
              <option key={option.value} value={option.value}>{option.label}</option>
            ))}
          </select>
        </label>
      </div>

      <label>
        <span>הערות קבועות</span>
        <textarea name="notes" rows={4} defaultValue={group?.notes ?? ""} placeholder="מגבלות, דגשים, תנאים קבועים..." />
      </label>

      {error ? <p className="formError" role="alert">{error}</p> : null}
      <button className="primaryButton" type="submit" disabled={pending}>
        {pending ? "שומר..." : group ? "שמור שינויים" : "צור קבוצה"}
      </button>
    </form>
  );
}
