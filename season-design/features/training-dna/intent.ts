import { parsePracticeIntent } from "./schema";
import type { PracticeIntentInput } from "./types";

export function normalizeIntent(input: unknown): PracticeIntentInput {
  return parsePracticeIntent(input);
}
