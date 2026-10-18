import type { GeneratedPractice, PracticeContext, ValidationIssue } from "./types";

export function validatePractice(
  practice: GeneratedPractice,
  context: PracticeContext,
): { errors: ValidationIssue[]; warnings: ValidationIssue[] } {
  const errors: ValidationIssue[] = [];
  const warnings: ValidationIssue[] = [];
  const total = practice.blocks.reduce((sum, block) => sum + block.seconds, 0);
  if (total !== context.intent.durationSeconds) {
    errors.push({ code:"DURATION_MISMATCH",message:"משך האימון אינו תואם לבקשה" });
  }
  if (practice.blocks.some((block) => block.seconds <= 0 || !Number.isInteger(block.seconds))) {
    errors.push({ code:"INVALID_BLOCK_DURATION",message:"זמן בלוק חייב להיות מספר שניות חיובי ושלם" });
  }
  for (const block of practice.blocks) {
    if (!context.intent.focuses.includes(block.focus)) {
      errors.push({ code:"INVALID_FOCUS",message:"בלוק שויך למוקד שלא נבחר" });
    }
    if (context.intent.sourcePolicy === "library-only" && block.exercise?.source === "generated") {
      errors.push({ code:"SOURCE_POLICY_VIOLATION",message:"אין ליצור תרגיל חדש במצב ספרייה בלבד" });
    }
    if (block.exercise && (!block.exercise.exerciseId || !block.exercise.versionId)) {
      errors.push({ code:"INVALID_EXERCISE_VERSION",message:"חסר מזהה לגרסת תרגיל" });
    }
  }

  const fixed = context.intent.warmup.mode === "fixed" ? (context.intent.warmup.fixedBlocks ?? []) : [];
  fixed.forEach((entry) => {
    const actual = practice.blocks.find((block) => block.id === entry.id);
    if (!actual || actual.seconds !== entry.seconds || !actual.locked) {
      errors.push({ code:"LOCKED_WARMUP_CHANGED",message:"חימום קבוע השתנה ללא אישור" });
    }
  });

  const main = context.intent.focuses[0];
  const gameTransfer = practice.blocks.some((block) => block.focus === main &&
    (block.role === "decide" || block.role === "compete") &&
    (block.exercise?.stage === "game-situation" ||
      (block.exercise?.metadata?.transfer ?? 0) >= 3));
  if (!gameTransfer) {
    if (context.intent.allowNoGameTransfer) {
      warnings.push({ code:"GAME_TRANSFER_OVERRIDE",message:"המאמן אישר אימון ללא תרגול מצב משחק" });
    } else {
      errors.push({ code:"GAME_TRANSFER_REQUIRED",message:"חסר בלוק המשלב החלטה מתוך מצב משחק" });
    }
  }
  const ids = practice.blocks.map((b) => b.exercise?.exerciseId).filter(Boolean);
  if (new Set(ids).size !== ids.length) {
    warnings.push({ code:"DUPLICATE_EXERCISE",message:"אותו תרגיל מופיע ביותר מבלוק אחד" });
  }
  if (practice.blocks.some((b) => b.exercise && b.exercise.maxPlayers === null)) {
    warnings.push({ code:"UNKNOWN_CAPACITY",message:"לא ידועה קיבולת שחקנים לחלק מהתרגילים" });
  }
  return { errors, warnings };
}
