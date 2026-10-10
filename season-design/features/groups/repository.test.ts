import { describe, expect, it } from "vitest";
import type { Group, GroupSkillLevel, SkillLevel } from "./types";
import {
  createGroupRepository,
  type CoachAccess,
  type GroupDataSource,
  type SkillLevelHistoryInput,
} from "./repository";

const coachA: CoachAccess = {
  id: "11111111-1111-1111-1111-111111111111",
  accessStatus: "active",
};

class MemoryGroupSource implements GroupDataSource {
  groups: Group[] = [];
  skillLevels: GroupSkillLevel[] = [];
  history: SkillLevelHistoryInput[] = [];

  async listGroups(coachId: string) {
    return this.groups.filter((group) => group.coachId === coachId);
  }

  async getGroup(coachId: string, groupId: string) {
    return this.groups.find((group) => group.coachId === coachId && group.id === groupId) ?? null;
  }

  async insertGroup(coachId: string, input: Omit<Group, "id" | "coachId" | "createdAt" | "updatedAt">) {
    const now = "2026-10-10T21:00:00.000Z";
    const group: Group = {
      ...input,
      id: "aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa",
      coachId,
      createdAt: now,
      updatedAt: now,
    };
    this.groups.push(group);
    return group;
  }

  async updateGroup(
    coachId: string,
    groupId: string,
    input: Omit<Group, "id" | "coachId" | "createdAt" | "updatedAt">,
  ) {
    const index = this.groups.findIndex(
      (group) => group.coachId === coachId && group.id === groupId,
    );
    if (index < 0) return null;
    const current = this.groups[index];
    const updated: Group = {
      ...current,
      ...input,
      updatedAt: "2026-10-10T22:00:00.000Z",
    };
    this.groups[index] = updated;
    return updated;
  }

  async getSkillLevel(coachId: string, groupId: string, skillId: string) {
    const ownsGroup = await this.getGroup(coachId, groupId);
    if (!ownsGroup) return null;
    return (
      this.skillLevels.find(
        (entry) => entry.groupId === groupId && entry.skillId === skillId,
      ) ?? null
    );
  }

  async upsertSkillLevel(
    coachId: string,
    groupId: string,
    skillId: string,
    level: SkillLevel,
  ) {
    const ownsGroup = await this.getGroup(coachId, groupId);
    if (!ownsGroup) throw new Error("GROUP_NOT_FOUND");
    const entry: GroupSkillLevel = {
      groupId,
      skillId,
      approvedLevel: level,
      systemSuggestedLevel: null,
      suggestionReason: null,
      updatedAt: "2026-10-10T22:00:00.000Z",
    };
    this.skillLevels = this.skillLevels.filter(
      (item) => !(item.groupId === groupId && item.skillId === skillId),
    );
    this.skillLevels.push(entry);
    return entry;
  }

  async insertSkillLevelHistory(input: SkillLevelHistoryInput) {
    this.history.push(input);
  }
}

const validInput = {
  name: "ז׳ מצוינות",
  ageCategory: "middle_school" as const,
  ageGradeLabel: "כיתה ז׳",
  typicalPlayerCount: 12,
  generalLevel: "intermediate" as const,
  notes: "",
  recurringConstraints: {},
};

describe("group repository", () => {
  it("creates, lists, reads, and updates a coach-owned group", async () => {
    const source = new MemoryGroupSource();
    const repository = createGroupRepository(source, coachA);

    const created = await repository.createGroup(validInput);
    expect(created.name).toBe("ז׳ מצוינות");
    expect(await repository.listGroups()).toHaveLength(1);
    expect((await repository.getGroup(created.id))?.coachId).toBe(coachA.id);

    const updated = await repository.updateGroup(created.id, {
      ...validInput,
      name: "ז׳ מצוינות ברנר",
      typicalPlayerCount: 14,
    });
    expect(updated.name).toBe("ז׳ מצוינות ברנר");
    expect(updated.typicalPlayerCount).toBe(14);
  });

  it("rejects an empty name and invalid player count", async () => {
    const repository = createGroupRepository(new MemoryGroupSource(), coachA);

    await expect(repository.createGroup({ ...validInput, name: "   " })).rejects.toThrow();
    await expect(
      repository.createGroup({ ...validInput, typicalPlayerCount: 0 }),
    ).rejects.toThrow();
  });

  it("rejects invalid skill levels and records approved level history", async () => {
    const source = new MemoryGroupSource();
    const repository = createGroupRepository(source, coachA);
    const group = await repository.createGroup(validInput);
    const skillId = "bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb";

    await expect(
      repository.setApprovedSkillLevel(group.id, skillId, "expert" as SkillLevel),
    ).rejects.toThrow();

    const first = await repository.setApprovedSkillLevel(group.id, skillId, "basic");
    const second = await repository.setApprovedSkillLevel(group.id, skillId, "intermediate");

    expect(first.approvedLevel).toBe("basic");
    expect(second.approvedLevel).toBe("intermediate");
    expect(source.history).toEqual([
      expect.objectContaining({ fromLevel: null, toLevel: "basic", source: "initial" }),
      expect.objectContaining({ fromLevel: "basic", toLevel: "intermediate", source: "coach" }),
    ]);
  });

  it("rejects all repository access for an inactive profile", async () => {
    const repository = createGroupRepository(new MemoryGroupSource(), {
      id: "33333333-3333-3333-3333-333333333333",
      accessStatus: "disabled",
    });

    await expect(repository.listGroups()).rejects.toThrow("COACH_ACCESS_DISABLED");
    await expect(repository.createGroup(validInput)).rejects.toThrow("COACH_ACCESS_DISABLED");
  });
});
