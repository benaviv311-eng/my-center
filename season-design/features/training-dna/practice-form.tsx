"use client";

import { useState, type FormEvent } from "react";
import type { Group, SkillSlug } from "@/features/groups/types";
import { CANONICAL_SKILLS } from "@/features/groups/types";
import { APPROVED_WARMUP } from "./approved-warmup";
import { createPracticePreviewAction, saveNewPracticeAction } from "./actions";
import { PracticePreview } from "./practice-preview";
import type { GenerationResult } from "./generator";
import type { PracticeIntentInput, PracticeStyle, SourcePolicy } from "./types";

type Groups = Pick<Group, "id" | "name">[];
type Generate = (input: PracticeIntentInput) => Promise<GenerationResult>;
type Save = (input: PracticeIntentInput) => Promise<{ id: string }>;

const styles: Array<{ value: PracticeStyle; label: string }> = [
  { value: "regular", label: "רגיל" },
  { value: "technical", label: "טכני" },
  { value: "game-based", label: "משחקי" },
  { value: "advanced", label: "מתקדם" },
  { value: "competitive", label: "תחרותי" },
  { value: "light", label: "עומס מופחת" },
];
const policies: Array<{ value: SourcePolicy; label: string }> = [
  { value: "prefer-library", label: "עדיפות לספרייה" },
  { value: "library-only", label: "ספרייה בלבד" },
  { value: "free-generation", label: "יצירה חופשית" },
];

export function PracticeForm({
  groups,
  generate = createPracticePreviewAction,
  save = saveNewPracticeAction,
}: {
  groups: Groups;
  generate?: Generate;
  save?: Save;
}) {
  const [groupId, setGroupId] = useState("");
  const [duration, setDuration] = useState(90);
  const [primaryOutcome, setPrimaryOutcome] = useState("קבלת סרב יציבה שמאפשרת התקפה");
  const [focus1, setFocus1] = useState<SkillSlug>("reception");
  const [focus2, setFocus2] = useState<SkillSlug | "">("");
  const [focus3, setFocus3] = useState<SkillSlug | "">("");
  const [style, setStyle] = useState<PracticeStyle>("regular");
  const [warmup, setWarmup] = useState<"fixed" | "topic">("fixed");
  const [policy, setPolicy] = useState<SourcePolicy>("prefer-library");
  const [allowNoGameTransfer, setAllowNoGameTransfer] = useState(false);
  const [preview, setPreview] = useState<GenerationResult | null>(null);
  const [savedId, setSavedId] = useState<string | null>(null);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  const buildIntent = (): PracticeIntentInput => ({
    groupId: groupId || null,
    durationSeconds: duration * 60,
    primaryOutcome: primaryOutcome.trim(),
    focuses: [focus1, focus2, focus3].filter(Boolean) as SkillSlug[],
    style,
    warmup: warmup === "fixed"
      ? { mode: "fixed", fixedBlocks: APPROVED_WARMUP.map((block) => ({ ...block, coachingCues: [...block.coachingCues] })) }
      : { mode: "topic" },
    sourcePolicy: policy,
    allowNoGameTransfer,
  });

  async function handleGenerate(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSavedId(null);
    setPreview(null);
    setError("");
    const intent = buildIntent();
    if (!intent.primaryOutcome || new Set(intent.focuses).size !== intent.focuses.length) {
      setError("יש לבחור מטרה ולוודא שאין מוקדים כפולים.");
      return;
    }
    setBusy(true);
    try {
      const result = await generate(intent);
      setPreview(result);
      if (!result.ok) setError(result.details.join(" · ") || "לא ניתן לבנות את האימון מהתרגילים הזמינים.");
    } catch {
      setError("לא ניתן ליצור אימון כרגע. יש לבדוק חיבור והרשאות ולנסות שוב.");
    } finally {
      setBusy(false);
    }
  }

  async function handleSave() {
    if (!preview?.ok || busy) return;
    setBusy(true);
    setError("");
    try {
      const saved = await save(buildIntent());
      setSavedId(saved.id);
    } catch {
      setError("האימון לא נשמר. בדוק חיבור ונסה שוב.");
    } finally {
      setBusy(false);
    }
  }

  const focusOptions = CANONICAL_SKILLS.map((skill) => (
    <option value={skill.slug} key={skill.slug}>{skill.labelHe}</option>
  ));
  return (
    <div className="pageStack" dir="rtl">
      <form className="panel formStack" onSubmit={handleGenerate}>
        <div className="formGrid">
          <label htmlFor="dna-group">קבוצה
            <select id="dna-group" value={groupId} onChange={(e) => setGroupId(e.target.value)}>
              <option value="">קבוצה זמנית</option>
              {groups.map((group) => <option key={group.id} value={group.id}>{group.name}</option>)}
            </select>
          </label>
          <label htmlFor="dna-duration">משך אימון
            <select id="dna-duration" value={duration} onChange={(e) => setDuration(Number(e.target.value))}>
              {[45, 60, 75, 90, 105, 120].map((m) => <option key={m} value={m}>{m} דקות</option>)}
            </select>
          </label>
          <label htmlFor="dna-goal">מטרת האימון
            <input id="dna-goal" value={primaryOutcome} maxLength={180}
              onChange={(e) => setPrimaryOutcome(e.target.value)} required />
          </label>
          <label htmlFor="dna-style">אופי האימון
            <select id="dna-style" value={style} onChange={(e) => setStyle(e.target.value as PracticeStyle)}>
              {styles.map((item) => <option key={item.value} value={item.value}>{item.label}</option>)}
            </select>
          </label>
          <label htmlFor="dna-focus1">מוקד ראשי
            <select id="dna-focus1" value={focus1} onChange={(e) => setFocus1(e.target.value as SkillSlug)}>
              {focusOptions}
            </select>
          </label>
          <label htmlFor="dna-focus2">מוקד משני
            <select id="dna-focus2" value={focus2} onChange={(e) => setFocus2(e.target.value as SkillSlug | "")}>
              <option value="">ללא</option>{focusOptions}
            </select>
          </label>
          <label htmlFor="dna-focus3">מוקד שלישי
            <select id="dna-focus3" value={focus3} onChange={(e) => setFocus3(e.target.value as SkillSlug | "")}>
              <option value="">ללא</option>{focusOptions}
            </select>
          </label>
          <label htmlFor="dna-warmup">חימום
            <select id="dna-warmup" value={warmup} onChange={(e) => setWarmup(e.target.value as "fixed" | "topic")}>
              <option value="fixed">החימום הקבוע שלי — 24:15</option>
              <option value="topic">חימום לפי נושא</option>
            </select>
          </label>
          <label htmlFor="dna-source">מקור תרגילים
            <select id="dna-source" value={policy} onChange={(e) => setPolicy(e.target.value as SourcePolicy)}>
              {policies.map((item) => <option key={item.value} value={item.value}>{item.label}</option>)}
            </select>
          </label>
        </div>
        <label style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <input style={{ width: "auto" }} type="checkbox" checked={allowNoGameTransfer}
            onChange={(e) => setAllowNoGameTransfer(e.target.checked)} />
          אישור חריג: אימון בלי מצב משחק
        </label>
        <button className="primaryButton" type="submit" disabled={busy}>
          {busy ? "בונה אימון…" : "בנה אימון"}
        </button>
        {error && <p role="alert" className="formError">{error}</p>}
      </form>

      {preview?.ok && (
        <>
          <PracticePreview practice={preview.practice} />
          <div className="panel">
            <button className="primaryButton" disabled={busy} type="button" onClick={handleSave}>
              שמור אימון
            </button>
            {savedId && <p>האימון נשמר. <a className="backLink" href={`/practices/${savedId}`}>פתח אימון שמור</a></p>}
          </div>
        </>
      )}
    </div>
  );
}
