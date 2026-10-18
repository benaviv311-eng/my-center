import type { RankedExercise } from "./ranker";
import type { ArcSlot, CandidateExercise, CompositionFailure, GeneratedPractice, PracticeBlock, PracticeContext } from "./types";

function stableIdentifier(source: string): string {
  let hash = 2166136261;
  for (let i=0; i<source.length; i++) {
    hash = Math.imul(hash ^ source.charCodeAt(i), 16777619);
  }
  return (hash >>> 0).toString(16).padStart(8,"0");
}

export function composePractice(
  context: PracticeContext,
  slots: ArcSlot[],
  rankedBySlot: RankedExercise[][],
): GeneratedPractice | CompositionFailure {
  const fixed = context.intent.warmup.mode === "fixed"
    ? (context.intent.warmup.fixedBlocks ?? []) : [];
  const blocks: PracticeBlock[] = fixed.map((entry) => ({
    id: entry.id,
    role: "prepare",
    focus: context.intent.focuses[0],
    exercise: null,
    title: entry.title,
    seconds: entry.seconds,
    locked: true,
    rationale: {
      why: "חימום קבוע שנבחר על ידי המאמן",
      whyNow: "הכנה קבועה בתחילת האימון",
      watch: entry.coachingCues.slice(0,2).join(" · "),
      next: "תרגול ממוקד",
      evidenceKind: "fact",
    },
    warnings: [],
  }));
  const used: CandidateExercise[] = [];
  let skippedSeconds = 0;
  for (let index=0; index<slots.length; index++) {
    const slot = slots[index];
    const ranked = rankedBySlot[index] ?? [];
    const available = ranked.find((entry) => !used.some((item) =>
      item.exerciseId === entry.exercise.exerciseId)) ?? ranked[0];
    if (!available) {
      if (!slot.required) { skippedSeconds += slot.targetSeconds; continue; }
      return { ok:false,code:"NO_ELIGIBLE_EXERCISES",
        details:[`אין תרגיל מתאים לשלב ${slot.role} בנושא ${slot.focus}`] };
    }
    const exercise = available.exercise;
    const min = exercise.metadata?.minSeconds ?? 1;
    const max = exercise.metadata?.maxSeconds ?? Number.MAX_SAFE_INTEGER;
    const seconds = slot.targetSeconds;
    if (seconds < min || seconds > max) {
      return { ok:false,code:"DURATION_IMPOSSIBLE",
        details:[`משך השלב ${slot.role} חורג מטווח התרגיל ${exercise.title}`] };
    }
    used.push(exercise);
    blocks.push({
      id: `block-${index}`,
      role: slot.role,
      focus: slot.focus,
      exercise,
      title: exercise.title,
      seconds,
      locked: false,
      rationale: {
        why: `תרגול ${slot.focus} כחלק ממטרת האימון`,
        whyNow: `שלב ${slot.role} ברצף הלמידה`,
        watch: exercise.coachingCues.slice(0,2).join(" · ") || "איכות ביצוע וקבלת החלטות",
        next: slots[index+1]?.role ?? "סיכום האימון",
        evidenceKind: "rule",
      },
      warnings: [],
    });
  }
  if (skippedSeconds > 0) {
    const receiver = [...blocks].reverse().find((block) => !block.locked);
    if (!receiver) return { ok:false,code:"DURATION_IMPOSSIBLE",details:["לא נותר בלוק גמיש"] };
    const newSeconds = receiver.seconds + skippedSeconds;
    if (receiver.exercise?.metadata?.maxSeconds !== null &&
      receiver.exercise?.metadata?.maxSeconds !== undefined &&
      newSeconds > receiver.exercise.metadata.maxSeconds) {
      return { ok:false,code:"DURATION_IMPOSSIBLE",details:["לא ניתן לחלק זמן משלב חסר"] };
    }
    receiver.seconds = newSeconds;
  }
  const duration = blocks.reduce((sum, block) => sum + block.seconds, 0);
  if (duration !== context.intent.durationSeconds || blocks.some((block) => !Number.isInteger(block.seconds) || block.seconds<=0)) {
    return { ok:false,code:"DURATION_IMPOSSIBLE",details:["לא ניתן לשמור על משך מדויק"] };
  }
  return {
    id: "training-" + stableIdentifier(JSON.stringify({ intent:context.intent,
      exercises:blocks.map((b)=>b.exercise?.versionId ?? b.id) })),
    intent: context.intent,
    blocks,
    warnings: [],
    evidence: context.history,
  };
}
