import type { Group, SkillLevel, SkillSlug } from "@/features/groups/types";
import type { FocusEvidence, GroupPlanningSnapshot, PracticeEvidence, ProblemEvidence } from "./types";

/** Skill UUIDs are resolved to slugs at the repository boundary, before planning. */
export function buildGroupState(
  group: Group | null,
  approvedLevels: Partial<Record<SkillSlug, SkillLevel>>,
  _history: PracticeEvidence[],
  _feedback: FocusEvidence[],
): GroupPlanningSnapshot | null {
  if (!group) return null;
  const constraints = group.recurringConstraints ?? {};
  const equipment = Array.isArray(constraints.equipment) &&
    constraints.equipment.every((item) => typeof item === "string")
    ? constraints.equipment as string[] : null;
  const courtCount = Number.isInteger(constraints.courtCount) &&
    Number(constraints.courtCount) > 0 ? Number(constraints.courtCount) : null;
  return {
    id: group.id,
    name: group.name,
    playerCount: group.typicalPlayerCount,
    generalLevel: group.generalLevel,
    ageCategory: group.ageCategory,
    approvedLevels: { ...approvedLevels },
    equipment,
    courtCount,
  };
}

export function deriveProblems(feedback: FocusEvidence[]): ProblemEvidence[] {
  return feedback
    .filter((entry) => entry.note.trim().length > 0 || (entry.score !== null && entry.score <= 2))
    .map((entry) => ({
      id: entry.id,
      focus: entry.focus,
      problem: entry.note.trim() || `דירוג ביצוע ${entry.score}/5`,
      kind: entry.kind,
      confidence: entry.kind === "coach-reported" ? "high" : "low",
    }));
}
