import { createHash } from "node:crypto";
import type {
  ExerciseKind,
  ProgressionStage,
} from "../types";
import type { SkillSlug } from "../../groups/types";
import { EXERCISE_SPREADSHEET_ID } from "./config";

export interface SheetRow {
  rowNumber: number;
  values: string[];
}

export interface NormalizedExercise {
  source: "sheets";
  kind: ExerciseKind;
  progressionStage: ProgressionStage | null;
  skillSlug: SkillSlug | null;
  title: string;
  description: string;
  content: Record<string, unknown>;
  sourceSpreadsheetId: string;
  sourceTab: string;
  sourceRow: number;
  sourceKey: string | null;
  sourceHash: string;
  normalizedSignature: string;
}

export interface CoreTabInput {
  tabName: string;
  rows: SheetRow[];
}

export function cleanCell(value: unknown): string {
  return typeof value === "string" ? value.trim() : "";
}

export function normalizeIdentityText(value: string): string {
  return value.trim().replace(/\s+/g, " ").toLocaleLowerCase("he-IL");
}

export function createSourceHash(value: Record<string, unknown>): string {
  return createHash("sha256").update(JSON.stringify(value), "utf8").digest("hex");
}

export function createNormalizedExercise(input: {
  kind: ExerciseKind;
  progressionStage: ProgressionStage | null;
  skillSlug: SkillSlug | null;
  title: string;
  description?: string;
  content?: Record<string, unknown>;
  sourceTab: string;
  sourceRow: number;
}): NormalizedExercise {
  const title = cleanCell(input.title);
  const description = cleanCell(input.description ?? "");
  const content = input.content ?? { title, description };
  const signatureParts = [
    input.sourceTab,
    input.progressionStage ?? input.kind,
    normalizeIdentityText(title),
  ];

  const hashPayload = {
    kind: input.kind,
    progressionStage: input.progressionStage,
    skillSlug: input.skillSlug,
    title,
    description,
    content,
  };

  return {
    source: "sheets",
    kind: input.kind,
    progressionStage: input.progressionStage,
    skillSlug: input.skillSlug,
    title,
    description,
    content,
    sourceSpreadsheetId: EXERCISE_SPREADSHEET_ID,
    sourceTab: input.sourceTab,
    sourceRow: input.sourceRow,
    sourceKey: null,
    sourceHash: createSourceHash(hashPayload),
    normalizedSignature: signatureParts.join("|"),
  };
}
