import type { ArcSlot, CandidateExercise, PracticeContext } from "./types";

type Dimension = "goal" | "progression" | "density" | "transfer" | "flow";
export interface RankedExercise {
  exercise: CandidateExercise;
  score: number;
  dimensions: Record<Dimension, number>;
  penalties: Record<string, number>;
}

const weights: Record<PracticeContext["intent"]["style"], [number,number,number,number,number]> = {
  regular: [5,4,3,4,3],
  technical: [5,5,5,2,3],
  "game-based": [5,3,2,6,3],
  advanced: [5,4,2,6,3],
  competitive: [5,3,2,6,3],
  light: [5,4,3,3,4],
};

const stageByRole: Record<ArcSlot["role"], CandidateExercise["stage"][]> = {
  prepare: ["isolated","fixed"],
  solve: ["isolated","fixed"],
  stabilize: ["fixed","complex"],
  decide: ["complex","game-situation"],
  compete: ["game-situation"],
};

function scoreDimensions(slot: ArcSlot, exercise: CandidateExercise): Record<Dimension,number> {
  const metadata = exercise.metadata;
  const knownStage = exercise.stage;
  return {
    goal: exercise.skillSlugs.includes(slot.focus) ? 5 : 0,
    progression: knownStage === null ? 2.5 : stageByRole[slot.role].includes(knownStage) ? 5 : 2,
    density: metadata?.density ?? 2.5,
    transfer: metadata?.transfer ?? (knownStage === "game-situation" ? 3.5 : 2.5),
    flow: metadata?.setupComplexity === null || metadata?.setupComplexity === undefined
      ? 2.5 : 5-metadata.setupComplexity,
  };
}

export function rankExercises(
  slot: ArcSlot,
  context: PracticeContext,
  eligible: CandidateExercise[],
  selected: CandidateExercise[],
): RankedExercise[] {
  const [goal,progression,density,transfer,flow] = weights[context.intent.style];
  const seen = new Set(context.history.slice(-4).flatMap((row) => row.exerciseIds));
  const selectedFamilies = new Set(selected.map((item) => item.metadata?.familyKey).filter(Boolean));
  return eligible.map((exercise) => {
    const dimensions = scoreDimensions(slot, exercise);
    const penalties: Record<string,number> = {};
    if (seen.has(exercise.exerciseId)) penalties.recentRepeat = 15;
    if (exercise.metadata?.familyKey && selectedFamilies.has(exercise.metadata.familyKey)) {
      penalties.sameFamily = 8;
    }
    if (selected.some((item) => item.exerciseId === exercise.exerciseId)) penalties.adjacentDuplicate = 10;
    const previous = selected.at(-1);
    if (previous && (previous.metadata?.loads.physical ?? 0) >= 4 &&
      (exercise.metadata?.loads.physical ?? 0) >= 4) penalties.consecutiveHighLoad = 8;
    const base = dimensions.goal*goal + dimensions.progression*progression +
      dimensions.density*density + dimensions.transfer*transfer + dimensions.flow*flow;
    return { exercise, dimensions, penalties,
      score: base - Object.values(penalties).reduce((a,b)=>a+b,0) };
  }).sort((a,b)=> b.score-a.score ||
    a.exercise.exerciseId.localeCompare(b.exercise.exerciseId) ||
    a.exercise.versionId.localeCompare(b.exercise.versionId));
}
