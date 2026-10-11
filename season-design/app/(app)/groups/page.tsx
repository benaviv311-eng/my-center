import Link from "next/link";
import { listGroupsAction } from "@/features/groups/actions";

export default async function GroupsPage() {
  const groups = await listGroupsAction();

  return (
    <main className="shell pageStack">
      <div className="sectionHeading">
        <div>
          <p className="eyebrow">קבוצות</p>
          <h1 className="pageTitle">הקבוצות שלי</h1>
          <p className="heroCopy">כל קבוצה שומרת רמות, היסטוריה ותכנון מקצועי נפרד.</p>
        </div>
        <Link className="primaryButton" href="/groups/new">קבוצה חדשה</Link>
      </div>

      {groups.length === 0 ? (
        <section className="panel emptyState">
          <h2>עדיין אין קבוצות</h2>
          <p>צור קבוצה ראשונה כדי להתחיל לבנות פרופיל מקצועי ותוכניות אימון.</p>
          <Link className="secondaryButton" href="/groups/new">צור קבוצה</Link>
        </section>
      ) : (
        <section className="cardGrid">
          {groups.map((group) => (
            <Link className="groupCard" key={group.id} href={`/groups/${group.id}`}>
              <div>
                <p className="eyebrow">{group.ageGradeLabel || "קבוצה"}</p>
                <h2>{group.name}</h2>
              </div>
              <div className="groupMeta">
                <span>{group.typicalPlayerCount} שחקנים</span>
                <span>{group.generalLevel}</span>
              </div>
            </Link>
          ))}
        </section>
      )}
    </main>
  );
}
