import type { ArcRole, ArcSlot, GroupPlanningSnapshot, PracticeIntentInput, ProblemEvidence } from "./types";

type WeightedRole = { role: ArcRole; weight: number };
const styles: Record<PracticeIntentInput["style"], WeightedRole[]> = {
  regular: [
    { role: "prepare", weight: 15 }, { role: "solve", weight: 20 },
    { role: "stabilize", weight: 25 }, { role: "decide", weight: 20 },
    { role: "compete", weight: 20 },
  ],
  technical: [
    { role: "prepare", weight: 15 }, { role: "solve", weight: 30 },
    { role: "stabilize", weight: 30 }, { role: "decide", weight: 15 },
    { role: "compete", weight: 10 },
  ],
  "game-based": [
    { role: "prepare", weight: 10 }, { role: "decide", weight: 40 },
    { role: "compete", weight: 50 },
  ],
  advanced: [
    { role: "prepare", weight: 10 }, { role: "stabilize", weight: 15 },
    { role: "decide", weight: 40 }, { role: "compete", weight: 35 },
  ],
  competitive: [
    { role: "prepare", weight: 10 }, { role: "decide", weight: 35 },
    { role: "compete", weight: 55 },
  ],
  light: [
    { role: "prepare", weight: 25 }, { role: "solve", weight: 20 },
    { role: "stabilize", weight: 25 }, { role: "decide", weight: 20 },
    { role: "compete", weight: 10 },
  ],
};

function distributeSeconds(total: number, weights: number[]): number[] {
  const sum = weights.reduce((a, b) => a + b, 0);
  const allocated = weights.map((weight) => Math.floor(total * weight / sum));
  const residual = weights.map((weight, index) => ({
    index, fraction: total * weight / sum - allocated[index],
  })).sort((a,b) => b.fraction - a.fraction || a.index - b.index);
  const remaining = total - allocated.reduce((a,b) => a+b, 0);
  for (let i = 0; i < remaining; i++) {
    allocated[residual[i].index] += 1;
  }
  return allocated;
}

export function buildTrainingArc(
  intent: PracticeIntentInput,
  group: GroupPlanningSnapshot | null,
  _problems: ProblemEvidence[],
): ArcSlot[] {
  const fixed = intent.warmup.mode === "fixed"
    ? (intent.warmup.fixedBlocks ?? []).reduce((sum,b) => sum+b.seconds,0)
    : 0;
  const time = intent.durationSeconds - fixed;
  if (time <= 0) return [];
  let roles = styles[intent.style];
  if (group?.generalLevel === "advanced" || group?.generalLevel === "competitive") {
    if (intent.style === "regular") roles = styles.advanced;
  }
  if (fixed > 0) roles = roles.filter((item) => item.role !== "prepare");
  const first = intent.focuses[0];
  if (!first) return [];
  const rows = roles.map((item) => ({ ...item, focus: first }));
  // Secondary focuses are integrated near game-context work, not given isolated sequences.
  intent.focuses.slice(1).forEach((focus) => rows.splice(
    Math.max(0,rows.length - 1), 0, { role: "decide", weight: 12, focus },
  ));
  if (time < rows.length) return [];
  const seconds = distributeSeconds(time, rows.map((row) => row.weight));
  return rows.map((row,index) => ({
    role: row.role,
    focus: row.focus,
    targetSeconds: seconds[index],
    required: row.focus === first,
  }));
}
