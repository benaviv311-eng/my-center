import { SKILL_LEVELS } from "@/features/groups/types";
import type { ArcSlot, CandidateExercise, PracticeContext, ValidationIssue } from "./types";

export function filterEligible(
  slot: ArcSlot,
  context: PracticeContext,
): { candidates: CandidateExercise[]; warnings: ValidationIssue[] } {
  const warnings: ValidationIssue[] = [];
  const eligible = context.exercises.filter((exercise) => {
    if (!exercise.skillSlugs.includes(slot.focus)) return false;
    if (context.intent.sourcePolicy === "library-only" && exercise.source === "generated") return false;
    if (exercise.metadata?.roles.length && !exercise.metadata.roles.includes(slot.role)) return false;

    const min = exercise.metadata?.minPlayers ?? exercise.minPlayers;
    const max = exercise.metadata?.maxPlayers ?? exercise.maxPlayers;
    const count = context.group?.playerCount ?? null;
    if (count !== null && ((min !== null && count < min) || (max !== null && count > max))) {
      return false;
    }
    if (min === null || max === null) {
      warnings.push({ code: "UNKNOWN_CAPACITY", message: "מספר השחקנים המתאים לתרגיל אינו ידוע במלואו" });
    }

    const knownEquipment = context.equipment ?? context.group?.equipment ?? null;
    if (knownEquipment !== null && exercise.metadata?.equipment !== null &&
      exercise.metadata?.equipment !== undefined &&
      exercise.metadata.equipment.some((item) => !knownEquipment.includes(item))) {
      return false;
    }

    const level = context.group?.approvedLevels[slot.focus] ?? context.group?.generalLevel ?? null;
    if (level) {
      const index = SKILL_LEVELS.indexOf(level);
      const minIndex = exercise.minLevel ? SKILL_LEVELS.indexOf(exercise.minLevel) : 0;
      const maxIndex = exercise.maxLevel ? SKILL_LEVELS.indexOf(exercise.maxLevel) : SKILL_LEVELS.length-1;
      if (index < minIndex || index > maxIndex) return false;
    }
    return true;
  });
  return { candidates: eligible, warnings };
}
