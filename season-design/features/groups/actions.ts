"use server";

import { revalidatePath } from "next/cache";
import { getCurrentUser } from "@/lib/auth/current-user";
import { getSupabaseServer } from "@/lib/supabase/server";
import { createGroupRepository, type GroupDataSource, type SkillLevelHistoryInput } from "./repository";
import { groupInputSchema, type GroupInput } from "./schema";
import type { Group, GroupSkillLevel, SkillLevel } from "./types";

function mapGroup(row: Record<string, unknown>): Group {
  return {
    id: String(row.id),
    coachId: String(row.coach_id),
    name: String(row.name),
    ageCategory: row.age_category as Group["ageCategory"],
    ageGradeLabel: String(row.age_grade_label ?? ""),
    typicalPlayerCount: Number(row.typical_player_count),
    generalLevel: row.general_level as Group["generalLevel"],
    notes: String(row.notes ?? ""),
    recurringConstraints: (row.recurring_constraints as Record<string, unknown>) ?? {},
    createdAt: String(row.created_at),
    updatedAt: String(row.updated_at),
  };
}

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

async function buildRepository() {
  const user = await getCurrentUser();
  if (!user) throw new Error("AUTH_REQUIRED");

  const supabase = await getSupabaseServer();
  const { data: profile, error: profileError } = await supabase
    .from("profiles")
    .select("access_status")
    .eq("id", user.id)
    .single();

  if (profileError || !profile) throw new Error("PROFILE_NOT_FOUND");

  const source: GroupDataSource = {
    async listGroups(coachId) {
      const { data, error } = await supabase
        .from("groups")
        .select("*")
        .eq("coach_id", coachId)
        .order("updated_at", { ascending: false });
      if (error) throw error;
      return (data ?? []).map((row) => mapGroup(row as Record<string, unknown>));
    },

    async getGroup(coachId, groupId) {
      const { data, error } = await supabase
        .from("groups")
        .select("*")
        .eq("coach_id", coachId)
        .eq("id", groupId)
        .maybeSingle();
      if (error) throw error;
      return data ? mapGroup(data as Record<string, unknown>) : null;
    },

    async insertGroup(coachId, input) {
      const { data, error } = await supabase
        .from("groups")
        .insert({
          coach_id: coachId,
          name: input.name,
          age_category: input.ageCategory,
          age_grade_label: input.ageGradeLabel,
          typical_player_count: input.typicalPlayerCount,
          general_level: input.generalLevel,
          notes: input.notes,
          recurring_constraints: input.recurringConstraints,
        })
        .select("*")
        .single();
      if (error) throw error;
      return mapGroup(data as Record<string, unknown>);
    },

    async updateGroup(coachId, groupId, input) {
      const { data, error } = await supabase
        .from("groups")
        .update({
          name: input.name,
          age_category: input.ageCategory,
          age_grade_label: input.ageGradeLabel,
          typical_player_count: input.typicalPlayerCount,
          general_level: input.generalLevel,
          notes: input.notes,
          recurring_constraints: input.recurringConstraints,
          updated_at: new Date().toISOString(),
        })
        .eq("coach_id", coachId)
        .eq("id", groupId)
        .select("*")
        .maybeSingle();
      if (error) throw error;
      return data ? mapGroup(data as Record<string, unknown>) : null;
    },

    async getSkillLevel(coachId, groupId, skillId) {
      const group = await this.getGroup(coachId, groupId);
      if (!group) return null;
      const { data, error } = await supabase
        .from("group_skill_levels")
        .select("*")
        .eq("group_id", groupId)
        .eq("skill_id", skillId)
        .maybeSingle();
      if (error) throw error;
      return data ? mapSkillLevel(data as Record<string, unknown>) : null;
    },

    async upsertSkillLevel(coachId, groupId, skillId, level) {
      const group = await this.getGroup(coachId, groupId);
      if (!group) throw new Error("GROUP_NOT_FOUND");
      const { data, error } = await supabase
        .from("group_skill_levels")
        .upsert(
          {
            group_id: groupId,
            skill_id: skillId,
            approved_level: level,
            updated_at: new Date().toISOString(),
          },
          { onConflict: "group_id,skill_id" },
        )
        .select("*")
        .single();
      if (error) throw error;
      return mapSkillLevel(data as Record<string, unknown>);
    },

    async insertSkillLevelHistory(input: SkillLevelHistoryInput) {
      const { error } = await supabase.from("skill_level_history").insert({
        group_id: input.groupId,
        skill_id: input.skillId,
        from_level: input.fromLevel,
        to_level: input.toLevel,
        source: input.source,
        reason: input.reason ?? null,
      });
      if (error) throw error;
    },
  };

  return createGroupRepository(source, {
    id: user.id,
    accessStatus: profile.access_status as "active" | "disabled",
  });
}

export async function listGroupsAction() {
  return (await buildRepository()).listGroups();
}

export async function getGroupAction(groupId: string) {
  return (await buildRepository()).getGroup(groupId);
}

export async function createGroupAction(input: GroupInput) {
  const parsed = groupInputSchema.parse(input);
  const group = await (await buildRepository()).createGroup(parsed);
  revalidatePath("/groups");
  return group;
}

export async function updateGroupAction(groupId: string, input: GroupInput) {
  const parsed = groupInputSchema.parse(input);
  const group = await (await buildRepository()).updateGroup(groupId, parsed);
  revalidatePath("/groups");
  revalidatePath(`/groups/${groupId}`);
  return group;
}

export async function setApprovedSkillLevelAction(
  groupId: string,
  skillId: string,
  level: SkillLevel,
) {
  const entry = await (await buildRepository()).setApprovedSkillLevel(groupId, skillId, level);
  revalidatePath(`/groups/${groupId}`);
  return entry;
}
