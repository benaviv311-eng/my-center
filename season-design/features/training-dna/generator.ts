import { buildTrainingArc } from "./arc";
import { composePractice } from "./composer";
import { filterEligible } from "./eligibility";
import { deriveProblems } from "./group-state";
import { balanceLoad } from "./load";
import { rankExercises } from "./ranker";
import { validatePractice } from "./validator";
import type { CompositionFailure, GeneratedPractice, PracticeContext } from "./types";

export type GenerationResult = { ok:true; practice:GeneratedPractice } | CompositionFailure;

export function generatePractice(context: PracticeContext): GenerationResult {
  const problems = deriveProblems(context.feedback);
  const slots = buildTrainingArc(context.intent, context.group, problems);
  if (slots.length === 0) {
    return { ok:false,code:"DURATION_IMPOSSIBLE",details:["זמן קצר מדי למבנה האימון"] };
  }
  const selected: NonNullable<PracticeContext["exercises"]>[number][] = [];
  const warnings: GeneratedPractice["warnings"] = [];
  const pools = slots.map((slot) => {
    const filtered = filterEligible(slot, context);
    warnings.push(...filtered.warnings);
    const ranked = rankExercises(slot, context, filtered.candidates, selected);
    if (ranked.length) selected.push(ranked[0].exercise);
    return ranked;
  });
  const composition = composePractice(context, slots, pools);
  if ("code" in composition) return composition;
  const balanced = balanceLoad(composition.blocks, context);
  const proposed: GeneratedPractice = { ...composition,
    blocks: balanced.blocks, warnings: [...warnings,...balanced.warnings] };
  const checked = validatePractice(proposed, context);
  if (checked.errors.length) {
    return { ok:false,code:"VALIDATION_FAILED",details:checked.errors.map((issue) => issue.message) };
  }
  return { ok:true,practice:{ ...proposed,warnings:[...proposed.warnings,...checked.warnings] } };
}
