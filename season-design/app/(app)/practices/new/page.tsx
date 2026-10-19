import { listGroupsAction } from "@/features/groups/actions";
import { PracticeForm } from "@/features/training-dna/practice-form";

export default async function NewPracticePage() {
  const groups = await listGroupsAction();
  return (
    <main className="shell pageStack">
      <header className="hero">
        <p className="eyebrow">SeasonDesign · Training DNA</p>
        <h1 className="pageTitle">בנה את האימון הבא</h1>
        <p className="heroCopy">
          בחר קבוצה, מטרה ודגשים. המנוע יתכנן רצף מקצועי לפי רמה,
          זמן מדויק, תרגילים זמינים והתנסות במצבי משחק.
        </p>
      </header>
      <PracticeForm groups={groups.map(({ id, name }) => ({ id, name }))} />
    </main>
  );
}
