import type { PracticeBlock, PracticeContext, ValidationIssue } from "./types";

export function balanceLoad(
  blocks: PracticeBlock[],
  _context: PracticeContext,
): { blocks: PracticeBlock[]; warnings: ValidationIssue[] } {
  const warnings: ValidationIssue[] = [];
  for (let i=1; i<blocks.length; i++) {
    const first = blocks[i-1].exercise?.metadata?.loads;
    const second = blocks[i].exercise?.metadata?.loads;
    if ((first?.physical ?? 0) >= 4 && (second?.physical ?? 0) >= 4) {
      warnings.push({
        code: "CONSECUTIVE_PHYSICAL_LOAD",
        message: `העומס הגופני גבוה ברצף בין בלוקים ${i} ו-${i+1}`,
      });
    }
    if ((first?.cognitive ?? 0) >= 4 && (second?.cognitive ?? 0) >= 4) {
      warnings.push({
        code: "CONSECUTIVE_COGNITIVE_LOAD",
        message: "מומלץ לאפשר זמן איפוס בין שני תרגילים מורכבים",
      });
    }
  }
  return { blocks, warnings };
}
