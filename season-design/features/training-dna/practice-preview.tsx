import type { GeneratedPractice } from "./types";

const ROLE_LABELS = {
  prepare: "הכנה",
  solve: "פתרון",
  stabilize: "ייצוב",
  decide: "החלטה",
  compete: "תחרות",
} as const;

export function formatPracticeTime(seconds: number): string {
  if (!Number.isInteger(seconds) || seconds < 0) {
    throw new Error("INVALID_PRACTICE_TIME");
  }
  return `${Math.floor(seconds / 60).toString().padStart(2, "0")}:${(seconds % 60).toString().padStart(2, "0")}`;
}

export function PracticePreview({ practice }: { practice: GeneratedPractice }) {
  const total = practice.blocks.reduce((sum, block) => sum + block.seconds, 0);
  const matchesRequest = total === practice.intent.durationSeconds;

  return (
    <section dir="rtl" aria-label="תצוגת אימון" className="pageStack">
      <header className="panel">
        <p className="eyebrow">Training DNA</p>
        <h2 className="pageTitle">{practice.intent.primaryOutcome}</h2>
        <p>משך: <strong>{formatPracticeTime(total)}</strong></p>
        {!matchesRequest && (
          <p role="alert">אורך האימון אינו תואם לזמן שהתבקש ({formatPracticeTime(practice.intent.durationSeconds)})</p>
        )}
      </header>

      <ol className="pageStack" aria-label="רצף האימון">
        {practice.blocks.map((block) => (
          <li className="panel" data-testid={`block-${block.id}`} key={block.id}>
            <p className="eyebrow">{ROLE_LABELS[block.role]}</p>
            <h3>{block.title}</h3>
            <p><strong>{formatPracticeTime(block.seconds)}</strong> {block.locked && <span>נעול</span>}</p>
            <p>למה עכשיו: {block.rationale.whyNow}</p>
            <p>דגש: {block.rationale.watch}</p>
            {block.exercise?.coachingCues?.slice(0, 2).map((cue, index) => (
              <p key={`${block.id}-cue-${index}`}>{cue}</p>
            ))}
            {block.warnings.map((warning, index) => (
              <p key={`${block.id}-warning-${index}`} role="note">{warning}</p>
            ))}
          </li>
        ))}
      </ol>
      {practice.warnings.length > 0 && (
        <section aria-label="אזהרות תכנון" className="panel">
          <h3>מה כדאי לבדוק</h3>
          {practice.warnings.map((warning, index) => (
            <p key={`${warning.code}-${index}`}>{warning.message}</p>
          ))}
        </section>
      )}
    </section>
  );
}
