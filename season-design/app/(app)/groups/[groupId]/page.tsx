import Link from "next/link";
import { notFound } from "next/navigation";
import { getGroupAction } from "@/features/groups/actions";
import { GroupForm } from "@/features/groups/group-form";
import { SkillProfile, type SkillRow } from "@/features/groups/skill-profile";
import type { GroupSkillLevel, SkillLevel } from "@/features/groups/types";
import { getSupabaseServer } from "@/lib/supabase/server";

function mapSkillLevel(row: Record<string, unknown>): GroupSkillLevel {
  return {
    groupId: String(row.group_id),
    skillId: String(row.skill_id),
    approvedLevel: row.approved_level as SkillLevel,
    systemSuggestedLevel: (row.system_suggested_level as SkillLevel | null) ?? null,
    suggestionReason: (row.suggestion_reason as string | null) ?? null,
    updatedAt: String(row.updated_at),
  };
}

export default async function GroupPage({ params }: { params: Promise<{ groupId: string }> }) {
  const { groupId } = await params;
  const group = await getGroupAction(groupId);
  if (!group) notFound();

  const supabase = await getSupabaseServer();
  const [{ data: skillRows, error: skillsError }, { data: levelRows, error: levelsError }] =
    await Promise.all([
      supabase.from("skills").select("id, slug, label_he, sort_order").order("sort_order"),
      supabase.from("group_skill_levels").select("*").eq("group_id", groupId),
    ]);

  if (skillsError) throw skillsError;
  if (levelsError) throw levelsError;

  const skills: SkillRow[] = (skillRows ?? []).map((row) => ({
    id: String(row.id),
    slug: String(row.slug),
    labelHe: String(row.label_he),
    sortOrder: Number(row.sort_order),
  }));
  const savedLevels = (levelRows ?? []).map((row) => mapSkillLevel(row as Record<string, unknown>));

  return (
    <main className="shell pageStack">
      <Link className="backLink" href="/groups">חזרה לקבוצות</Link>

      <section className="groupHero panel">
        <div>
          <p className="eyebrow">{group.ageGradeLabel || "פרופיל קבוצה"}</p>
          <h1 className="pageTitle">{group.name}</h1>
          <p className="heroCopy">
            {group.typicalPlayerCount} שחקנים טיפוסיים · רמה כללית {group.generalLevel}
          </p>
        </div>
        <div className="heroActions">
          <Link className="primaryButton" href={`/practices/new?group=${group.id}`}>צור אימון</Link>
          <Link className="secondaryButton" href={`/programs/new?group=${group.id}`}>בנה תוכנית</Link>
        </div>
      </section>

      <SkillProfile
        groupId={group.id}
        skills={skills}
        savedLevels={savedLevels}
        fallbackLevel={group.generalLevel}
      />

      <section>
        <div className="sectionHeading">
          <div>
            <p className="eyebrow">פרטי קבוצה</p>
            <h2>עריכת נתונים בסיסיים</h2>
          </div>
        </div>
        <GroupForm group={group} />
      </section>
    </main>
  );
}
