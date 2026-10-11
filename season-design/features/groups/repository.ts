import { groupInputSchema, groupSkillLevelInputSchema, type GroupInput } from "./schema";
import type { Group, GroupSkillLevel, SkillLevel } from "./types";

export type CoachAccess = {
  id: string;
  accessStatus: "active" | "disabled";
};

export type SkillLevelHistoryInput = {
  groupId: string;
  skillId: string;
  fromLevel: SkillLevel | null;
  toLevel: SkillLevel;
  source: "coach" | "system_approved" | "initial";
  reason?: string | null;
};

export interface GroupDataSource {
  listGroups(coachId: string): Promise<Group[]>;
  getGroup(coachId: string, groupId: string): Promise<Group | null>;
  insertGroup(
    coachId: string,
    input: Omit<Group, "id" | "coachId" | "createdAt" | "updatedAt">,
  ): Promise<Group>;
  updateGroup(
    coachId: string,
    groupId: string,
    input: Omit<Group, "id" | "coachId" | "createdAt" | "updatedAt">,
  ): Promise<Group | null>;
  getSkillLevel(
    coachId: string,
    groupId: string,
    skillId: string,
  ): Promise<GroupSkillLevel | null>;
  upsertSkillLevel(
    coachId: string,
    groupId: string,
    skillId: string,
    level: SkillLevel,
  ): Promise<GroupSkillLevel>;
  insertSkillLevelHistory(input: SkillLevelHistoryInput): Promise<void>;
}

function assertCoachAccess(coach: CoachAccess) {
  if (coach.accessStatus !== "active") {
    throw new Error("COACH_ACCESS_DISABLED");
  }
}

function toGroupWrite(input: GroupInput) {
  return {
    name: input.name,
    ageCategory: input.ageCategory,
    ageGradeLabel: input.ageGradeLabel,
    typicalPlayerCount: input.typicalPlayerCount,
    generalLevel: input.generalLevel,
    notes: input.notes,
    recurringConstraints: input.recurringConstraints,
  };
}

export function createGroupRepository(source: GroupDataSource, coach: CoachAccess) {
  return {
    async listGroups() {
      assertCoachAccess(coach);
      return source.listGroups(coach.id);
    },

    async getGroup(groupId: string) {
      assertCoachAccess(coach);
      return source.getGroup(coach.id, groupId);
    },

    async createGroup(input: GroupInput) {
      assertCoachAccess(coach);
      const parsed = groupInputSchema.parse(input);
      return source.insertGroup(coach.id, toGroupWrite(parsed));
    },

    async updateGroup(groupId: string, input: GroupInput) {
      assertCoachAccess(coach);
      const parsed = groupInputSchema.parse(input);
      const updated = await source.updateGroup(coach.id, groupId, toGroupWrite(parsed));
      if (!updated) throw new Error("GROUP_NOT_FOUND");
      return updated;
    },

    async setApprovedSkillLevel(groupId: string, skillId: string, level: SkillLevel) {
      assertCoachAccess(coach);
      const parsed = groupSkillLevelInputSchema.parse({ groupId, skillId, level });
      const current = await source.getSkillLevel(coach.id, parsed.groupId, parsed.skillId);
      const next = await source.upsertSkillLevel(
        coach.id,
        parsed.groupId,
        parsed.skillId,
        parsed.level,
      );

      if (current?.approvedLevel !== parsed.level) {
        await source.insertSkillLevelHistory({
          groupId: parsed.groupId,
          skillId: parsed.skillId,
          fromLevel: current?.approvedLevel ?? null,
          toLevel: parsed.level,
          source: current ? "coach" : "initial",
          reason: null,
        });
      }

      return next;
    },
  };
}
