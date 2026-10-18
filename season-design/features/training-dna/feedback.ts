import type { SkillSlug } from "@/features/groups/types";
import type { FocusEvidence, GeneratedPractice } from "./types";

export interface PracticeFeedback {
  practiceId: string;
  completedBlockIds: string[];
  skippedBlockIds: string[];
  focusRatings: Partial<Record<SkillSlug, 1 | 2 | 3 | 4 | 5>>;
  difficulty: "too-easy" | "appropriate" | "too-hard";
  usefulExerciseIds: string[];
  difficultExerciseIds: string[];
  problemCategory: string | null;
  note: string;
}

export interface PracticeRecommendation {
  groupId: string | null;
  targetFocus: SkillSlug;
  action: "reinforce" | "progress" | "reduce-load" | "avoid-repeat";
  reason: string;
  evidenceIds: string[];
  confidence: "low" | "medium" | "high";
  status: "proposed";
}

export function interpretFeedback(
  feedback: PracticeFeedback,
  practice: GeneratedPractice,
): { evidence: FocusEvidence[]; recommendations: PracticeRecommendation[] } {
  if (feedback.practiceId !== practice.id) throw new Error("FEEDBACK_PRACTICE_MISMATCH");

  const completed = new Set(feedback.completedBlockIds);
  if (feedback.skippedBlockIds.some((id) => completed.has(id))) {
    throw new Error("FEEDBACK_BLOCK_CONFLICT");
  }
  const allowedBlockIds = new Set(practice.blocks.map((block) => block.id));
  if ([...completed, ...feedback.skippedBlockIds].some((id) => !allowedBlockIds.has(id))) {
    throw new Error("FEEDBACK_UNKNOWN_BLOCK");
  }
  const evidence: FocusEvidence[] = [];
  const recommendations: PracticeRecommendation[] = [];

  practice.intent.focuses.forEach((focus) => {
    const rating = feedback.focusRatings[focus] ?? null;
    if (rating === null) return;
    const id = `${practice.id}:${focus}:rating`;
    const note = feedback.note.trim();
    evidence.push({
      id,
      focus,
      score: rating,
      note,
      createdAt: "", // Persisted server timestamp is authoritative.
      kind: "coach-reported",
    });
    if (rating <= 2) {
      recommendations.push({
        groupId: practice.intent.groupId,
        targetFocus: focus,
        action: "reinforce",
        reason: feedback.problemCategory
          ? `המאמן סימן קושי ב-${focus}: ${feedback.problemCategory}`
          : `דירוג ביצוע נמוך בנושא ${focus}`,
        evidenceIds: [id],
        confidence: "medium",
        status: "proposed",
      });
    }
    // One excellent score is insufficient to infer a lasting progression.
  });

  const primary = practice.intent.focuses[0];
  if (primary && feedback.difficulty === "too-hard" &&
    /(קפיצ|ניתור|jump)/iu.test(feedback.note)) {
    const id = `${practice.id}:jump-load`;
    evidence.push({
      id, focus: primary, score: null, note: feedback.note.trim(),
      createdAt: "", kind: "coach-reported",
    });
    recommendations.push({
      groupId: practice.intent.groupId,
      targetFocus: primary,
      action: "reduce-load",
      reason: "המאמן דיווח על עומס קפיצות גבוה; מומלץ להפחית את נפח הקפיצות באימון הבא",
      evidenceIds: [id],
      confidence: "medium",
      status: "proposed",
    });
  }

  const difficult = new Set(feedback.difficultExerciseIds);
  if (primary && difficult.size > 0) {
    recommendations.push({
      groupId: practice.intent.groupId,
      targetFocus: primary,
      action: "avoid-repeat",
      reason: `לשקול חלופה ל-${difficult.size} תרגילים שסומנו כבעייתיים`,
      evidenceIds: [`${practice.id}:difficult-exercises`],
      confidence: "medium",
      status: "proposed",
    });
  }

  return { evidence, recommendations };
}
