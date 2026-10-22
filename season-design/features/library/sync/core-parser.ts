import type { ProgressionStage } from "../types";
import { SHEET_TAB_CONFIG } from "./config";
import {
  cleanCell,
  createNormalizedExercise,
  type CoreTabInput,
  type NormalizedExercise,
  type SheetRow,
} from "./sheet-row";

const PROGRESSION_COLUMNS: ReadonlyArray<{
  titleIndex: number;
  descriptionIndex: number;
  stage: ProgressionStage;
}> = [
  { titleIndex: 0, descriptionIndex: 1, stage: "isolated" },
  { titleIndex: 3, descriptionIndex: 4, stage: "fixed" },
  { titleIndex: 6, descriptionIndex: 7, stage: "complex" },
  { titleIndex: 9, descriptionIndex: 10, stage: "game-situation" },
];

function parseProgressionRow(
  tabName: string,
  row: SheetRow,
  skillSlug: "forearm_pass" | "overhead_setting" | "attack" | "block" | "serve",
): NormalizedExercise[] {
  if (row.rowNumber <= 2) {
    return [];
  }

  return PROGRESSION_COLUMNS.flatMap(
    ({ titleIndex, descriptionIndex, stage }) => {
      const title = cleanCell(row.values[titleIndex]);
      if (!title) {
        return [];
      }

      const description = cleanCell(row.values[descriptionIndex]);
      return [
        createNormalizedExercise({
          kind: "technical",
          progressionStage: stage,
          skillSlug,
          title,
          description,
          content: { title, description },
          sourceTab: tabName,
          sourceRow: row.rowNumber,
        }),
      ];
    },
  );
}

function parseWarmupRow(tabName: string, row: SheetRow): NormalizedExercise[] {
  if (row.rowNumber <= 1) {
    return [];
  }

  const title = cleanCell(row.values[0]);
  if (!title) {
    return [];
  }

  const content = {
    objective: cleanCell(row.values[1]),
    setup: cleanCell(row.values[2]),
    flow: cleanCell(row.values[3]),
    rules: cleanCell(row.values[4]),
    winCondition: cleanCell(row.values[5]),
    variations: cleanCell(row.values[6]),
    coachCues: cleanCell(row.values[7]),
    playerPrompt: cleanCell(row.values[8]),
    visual: cleanCell(row.values[9]),
  };

  return [
    createNormalizedExercise({
      kind: "warmup-game",
      progressionStage: null,
      skillSlug: null,
      title,
      description: content.objective,
      content,
      sourceTab: tabName,
      sourceRow: row.rowNumber,
    }),
  ];
}

export function parseCoreTab(input: CoreTabInput): NormalizedExercise[] {
  const config = SHEET_TAB_CONFIG[input.tabName as keyof typeof SHEET_TAB_CONFIG];

  if (!config) {
    throw new Error(`Unknown Sheet tab: ${input.tabName}`);
  }

  if (config.parser === "additional") {
    throw new Error("Use parseAdditionalBank for מאגר נוסף");
  }

  if (config.parser === "warmup") {
    return input.rows.flatMap((row) => parseWarmupRow(input.tabName, row));
  }

  return input.rows.flatMap((row) =>
    parseProgressionRow(
      input.tabName,
      row,
      config.skillSlug as "forearm_pass" | "overhead_setting" | "attack" | "block" | "serve",
    ),
  );
}
