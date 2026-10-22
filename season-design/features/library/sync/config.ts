import type { ExerciseKind } from "../types";
import type { SkillSlug } from "../../groups/types";

export const EXERCISE_SPREADSHEET_ID =
  "1Kk6e7Fhdm6ptiOEJeY_Lc2iw-pnWbLqkvACCXGl9GcI";

export type SheetParserKind = "warmup" | "additional" | "progression";

export interface SheetTabConfig {
  parser: SheetParserKind;
  kind: ExerciseKind | "additional-bank";
  skillSlug: SkillSlug | null;
}

export const SHEET_TAB_CONFIG = {
  "משחקי חימום": {
    parser: "warmup",
    kind: "warmup-game",
    skillSlug: null,
  },
  "מאגר נוסף": {
    parser: "additional",
    kind: "additional-bank",
    skillSlug: null,
  },
  "תחתית": {
    parser: "progression",
    kind: "technical",
    skillSlug: "forearm_pass",
  },
  "עילית": {
    parser: "progression",
    kind: "technical",
    skillSlug: "overhead_setting",
  },
  "הנחתה": {
    parser: "progression",
    kind: "technical",
    skillSlug: "attack",
  },
  "חסימה": {
    parser: "progression",
    kind: "technical",
    skillSlug: "block",
  },
  "הגשה": {
    parser: "progression",
    kind: "technical",
    skillSlug: "serve",
  },
} as const satisfies Record<string, SheetTabConfig>;

export type SheetTabName = keyof typeof SHEET_TAB_CONFIG;
