"use client";

import { useState, useTransition } from "react";
import { setApprovedSkillLevelAction } from "./actions";
import type { GroupSkillLevel, SkillLevel } from "./types";

export type SkillRow = {
  id: string;
  slug: string;
  labelHe: string;
  sortOrder: number;
};

const levels: Array<{ value: SkillLevel; label: string }> = [
  { value: "beginner", label: "מתחילים" },
  { value: "basic", label: "בסיסי" },
  { value: "intermediate", label: "בינוני" },
  { value: "advanced", label: "מתקדם" },
  { value: "competitive", label: "תחרותי" },
];

export function SkillProfile({
  groupId,
  skills,
  savedLevels,
  fallbackLevel,
}: {
  groupId: string;
  skills: SkillRow[];
  savedLevels: GroupSkillLevel[];
  fallbackLevel: SkillLevel;
}) {
  const [levelsBySkill, setLevelsBySkill] = useState<Record<string, SkillLevel>>(() =>
    Object.fromEntries(
      skills.map((skill) => [
        skill.id,
        savedLevels.find((entry) => entry.skillId === skill.id)?.approvedLevel ?? fallbackLevel,
      ]),
    ),
  );
  const [pendingSkill, setPendingSkill] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  return (
    <section className="panel">
      <div className="sectionHeading">
        <div>
          <p className="eyebrow">פרופיל מקצועי</p>
          <h2>רמה לפי מיומנות</h2>
        </div>
        <span className="mutedText">רמות שלא נשמרו עדיין מוצגות לפי הרמה הכללית</span>
      </div>

      <div className="skillList">
        {skills.map((skill) => (
          <label className="skillRow" key={skill.id}>
            <span>{skill.labelHe}</span>
            <select
              aria-label={`רמת ${skill.labelHe}`}
              value={levelsBySkill[skill.id]}
              disabled={isPending && pendingSkill === skill.id}
              onChange={(event) => {
                const level = event.target.value as SkillLevel;
                const previous = levelsBySkill[skill.id];
                setLevelsBySkill((current) => ({ ...current, [skill.id]: level }));
                setPendingSkill(skill.id);
                startTransition(async () => {
                  try {
                    await setApprovedSkillLevelAction(groupId, skill.id, level);
                  } catch {
                    setLevelsBySkill((current) => ({ ...current, [skill.id]: previous }));
                  } finally {
                    setPendingSkill(null);
                  }
                });
              }}
            >
              {levels.map((level) => (
                <option key={level.value} value={level.value}>{level.label}</option>
              ))}
            </select>
          </label>
        ))}
      </div>
    </section>
  );
}
