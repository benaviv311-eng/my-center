"use client";

import { useState, type FormEvent } from "react";
import { CANONICAL_SKILLS, type SkillSlug } from "@/features/groups/types";
import { submitTrainingFeedbackAction } from "./actions";
import type { PracticeFeedback, PracticeRecommendation } from "./feedback";
import type { GeneratedPractice } from "./types";

type FeedbackResult = {
  evidence: Array<{ id: string }>;
  recommendations: PracticeRecommendation[];
};

const skillLabels = new Map<string, string>(
  CANONICAL_SKILLS.map((skill) => [skill.slug, skill.labelHe]),
);

export function FeedbackForm({
  practice,
  submit = submitTrainingFeedbackAction,
}: {
  practice: GeneratedPractice;
  submit?: (feedback: PracticeFeedback) => Promise<FeedbackResult>;
}) {
  const [skipped, setSkipped] = useState<string[]>([]);
  const [ratings, setRatings] = useState<Partial<Record<SkillSlug, 1 | 2 | 3 | 4 | 5>>>(
    () => Object.fromEntries(practice.intent.focuses.map((focus) => [focus, 3])),
  );
  const [difficulty, setDifficulty] = useState<PracticeFeedback["difficulty"]>("appropriate");
  const [note, setNote] = useState("");
  const [problemCategory, setProblemCategory] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [done, setDone] = useState(false);
  const [recommendations, setRecommendations] = useState<PracticeRecommendation[]>([]);

  function markSkipped(blockId: string, isSkipped: boolean) {
    setSkipped((previous) => isSkipped
      ? Array.from(new Set([...previous, blockId]))
      : previous.filter((id) => id !== blockId));
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setBusy(true);
    try {
      const result = await submit({
        practiceId: practice.id,
        completedBlockIds: practice.blocks.map((block) => block.id).filter((id) => !skipped.includes(id)),
        skippedBlockIds: skipped,
        focusRatings: ratings,
        difficulty,
        usefulExerciseIds: [],
        difficultExerciseIds: [],
        problemCategory: problemCategory.trim() || null,
        note,
      });
      setRecommendations(result.recommendations);
      setDone(true);
    } catch {
      setError("לא ניתן לשמור את המשוב. יש לבדוק חיבור ולנסות שוב.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <section dir="rtl" className="panel">
      <h2>סיכום אימון — חצי דקה</h2>
      <p className="mutedText">המשוב ישמש להמלצות לאימון הבא, בלי לשנות רמת קבוצה ללא אישורך.</p>
      {done ? (
        <div className="pageStack" aria-live="polite">
          <p>המשוב נשמר.</p>
          {recommendations.length ? (
            <div>
              <h3>המלצות לאימון הבא</h3>
              {recommendations.map((item, index) => (
                <p key={`${item.targetFocus}-${index}`}>{item.reason}</p>
              ))}
            </div>
          ) : <p>אין כרגע צורך בהמלצת שינוי.</p>}
        </div>
      ) : (
        <form className="formStack" onSubmit={handleSubmit}>
          <fieldset>
            <legend>מה לא הספקנו לבצע?</legend>
            {practice.blocks.map((block) => (
              <label key={block.id} htmlFor={`skip-${block.id}`}
                style={{ display: "flex", alignItems: "center", gap: 8, marginBlock: 10 }}>
                <input id={`skip-${block.id}`} type="checkbox" checked={skipped.includes(block.id)}
                  onChange={(event) => markSkipped(block.id, event.target.checked)}
                  style={{ width: "auto" }} />
                דילגתי על {block.title}
              </label>
            ))}
          </fieldset>
          <div className="formGrid">
            {practice.intent.focuses.map((focus) => (
              <label key={focus} htmlFor={`rating-${focus}`}>
                ציון {skillLabels.get(focus) ?? focus}
                <select id={`rating-${focus}`} value={ratings[focus] ?? 3}
                  onChange={(event) => setRatings((r) => ({
                    ...r, [focus]: Number(event.target.value) as 1 | 2 | 3 | 4 | 5,
                  }))}>
                  {[1, 2, 3, 4, 5].map((score) => <option key={score} value={score}>{score} / 5</option>)}
                </select>
              </label>
            ))}
            <label htmlFor="feedback-difficulty">רמת קושי
              <select id="feedback-difficulty" value={difficulty}
                onChange={(event) => setDifficulty(event.target.value as PracticeFeedback["difficulty"])}>
                <option value="too-easy">קל מדי</option>
                <option value="appropriate">מתאים</option>
                <option value="too-hard">קשה מדי</option>
              </select>
            </label>
            <label htmlFor="feedback-problem">מה היה הקושי המרכזי?
              <input id="feedback-problem" value={problemCategory}
                onChange={(event) => setProblemCategory(event.target.value)} placeholder="לדוגמה: צעד ראשון לכדור קצר" />
            </label>
          </div>
          <label htmlFor="feedback-note">הערה קצרה
            <textarea id="feedback-note" value={note} maxLength={4000}
              onChange={(event) => setNote(event.target.value)} />
          </label>
          <button type="submit" disabled={busy} className="primaryButton">
            {busy ? "שומר משוב…" : "סיים אימון ושמור משוב"}
          </button>
          {error && <p className="formError" role="alert">{error}</p>}
        </form>
      )}
    </section>
  );
}
