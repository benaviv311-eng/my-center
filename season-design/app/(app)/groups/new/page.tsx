import Link from "next/link";
import { GroupForm } from "@/features/groups/group-form";

export default function NewGroupPage() {
  return (
    <main className="shell pageStack narrowPage">
      <Link className="backLink" href="/groups">חזרה לקבוצות</Link>
      <div>
        <p className="eyebrow">קבוצה חדשה</p>
        <h1 className="pageTitle">הגדר את נקודת הפתיחה</h1>
        <p className="heroCopy">אפשר לדייק רמה לכל מיומנות מיד אחרי יצירת הקבוצה.</p>
      </div>
      <GroupForm />
    </main>
  );
}
