import type { SupabaseClient } from "@supabase/supabase-js";
import type { GeneratedPractice } from "./types";
import { interpretFeedback, type PracticeFeedback, type PracticeRecommendation } from "./feedback";

export interface SavedPractice {
  id: string;
  coachId: string;
  groupId: string | null;
  revision: number;
  practice: GeneratedPractice;
}

export interface StoredRecommendation {
  id: string;
  status: "proposed" | "accepted" | "rejected";
  recommendation: PracticeRecommendation;
}

export interface TrainingDataSource {
  createPractice(coachId: string, value: GeneratedPractice): Promise<SavedPractice>;
  getPractice(coachId: string, practiceId: string): Promise<SavedPractice | null>;
  updatePractice(coachId: string, practiceId: string, value: GeneratedPractice,
    expectedRevision: number): Promise<SavedPractice | null>;
  createFeedback(coachId: string, value: PracticeFeedback): Promise<void>;
  createRecommendations?(coachId: string, recommendations: PracticeRecommendation[]): Promise<void>;
  listRecommendations(coachId: string, groupId: string | null): Promise<StoredRecommendation[]>;
  updateRecommendationStatus(coachId: string, recommendationId: string,
    status: "accepted" | "rejected"): Promise<boolean | void>;
}

export function createTrainingRepository(
  source: TrainingDataSource,
  actor: { id: string; accessStatus: "active" | "disabled" },
) {
  function assertActive() {
    if (actor.accessStatus !== "active") throw new Error("INACTIVE_COACH");
  }
  function validateDraft(practice: GeneratedPractice) {
    if (practice.blocks.length === 0 || practice.blocks.some((b) =>
      !Number.isInteger(b.seconds) || b.seconds <= 0) ||
      practice.blocks.reduce((sum,b)=>sum+b.seconds,0) !== practice.intent.durationSeconds) {
      throw new Error("INVALID_PRACTICE");
    }
  }
  return {
    async savePractice(practice: GeneratedPractice) {
      assertActive();
      validateDraft(practice);
      return source.createPractice(actor.id, structuredClone(practice));
    },
    async getPractice(practiceId: string) {
      assertActive();
      return source.getPractice(actor.id, practiceId);
    },
    async updatePractice(practiceId: string, practice: GeneratedPractice, revision: number) {
      assertActive();
      validateDraft(practice);
      const updated = await source.updatePractice(actor.id, practiceId, structuredClone(practice), revision);
      if (!updated) throw new Error("PRACTICE_CONFLICT");
      return updated;
    },
    async submitFeedback(feedback: PracticeFeedback) {
      assertActive();
      const saved = await source.getPractice(actor.id, feedback.practiceId);
      if (!saved) throw new Error("PRACTICE_NOT_FOUND");
      const interpreted = interpretFeedback(feedback, saved.practice);
      await source.createFeedback(actor.id, feedback);
      if (source.createRecommendations && interpreted.recommendations.length > 0) {
        await source.createRecommendations(actor.id, interpreted.recommendations);
      }
      return interpreted;
    },
    async listRecommendations(groupId: string | null) {
      assertActive();
      return source.listRecommendations(actor.id, groupId);
    },
    async setRecommendationStatus(recommendationId: string, status: "accepted" | "rejected") {
      assertActive();
      const updated = await source.updateRecommendationStatus(actor.id, recommendationId, status);
      if (updated === false) throw new Error("RECOMMENDATION_NOT_FOUND");
    },
  };
}

type PracticeRow = {
  id: string; coach_id: string; group_id: string | null; intent: GeneratedPractice["intent"];
  blocks: GeneratedPractice["blocks"]; validation_warnings: GeneratedPractice["warnings"];
  evidence: GeneratedPractice["evidence"]; revision: number;
};
function asSaved(row: PracticeRow): SavedPractice {
  return {
    id: row.id,
    coachId: row.coach_id,
    groupId: row.group_id,
    revision: row.revision,
    practice: {
      id: row.id,
      intent: row.intent,
      blocks: row.blocks,
      warnings: row.validation_warnings,
      evidence: row.evidence,
    },
  };
}

/** The caller supplies a logged-in, user-scoped Supabase client; RLS is mandatory. */
export function createSupabaseTrainingSource(client: SupabaseClient): TrainingDataSource {
  return {
    async createPractice(coachId, practice) {
      const { data, error } = await client.from("training_practices").insert({
        coach_id: coachId,
        group_id: practice.intent.groupId,
        intent: practice.intent,
        blocks: practice.blocks,
        evidence: practice.evidence,
        validation_warnings: practice.warnings,
      }).select("*").single();
      if (error) throw error;
      return asSaved(data as PracticeRow);
    },
    async getPractice(coachId, id) {
      const { data, error } = await client.from("training_practices")
        .select("*").eq("coach_id",coachId).eq("id",id).maybeSingle();
      if (error) throw error;
      return data ? asSaved(data as PracticeRow) : null;
    },
    async updatePractice(coachId, id, practice, expectedRevision) {
      const { data, error } = await client.from("training_practices").update({
        group_id: practice.intent.groupId,
        intent: practice.intent,
        blocks: practice.blocks,
        validation_warnings: practice.warnings,
        evidence: practice.evidence,
        revision: expectedRevision+1,
        updated_at: new Date().toISOString(),
      }).eq("coach_id",coachId).eq("id",id).eq("revision",expectedRevision)
        .select("*").maybeSingle();
      if (error) throw error;
      return data ? asSaved(data as PracticeRow) : null;
    },
    async createFeedback(coachId, value) {
      const { error } = await client.from("training_feedback").insert({
        coach_id: coachId, practice_id: value.practiceId, payload: value,
      });
      if (error) throw error;
    },
    async createRecommendations(coachId, values) {
      if (values.length === 0) return;
      const { error } = await client.from("training_recommendations").insert(
        values.map((value) => ({
          coach_id: coachId,
          group_id: value.groupId,
          payload: value,
          evidence: value.evidenceIds,
          status: "proposed",
        })),
      );
      if (error) throw error;
    },
    async listRecommendations(coachId, groupId) {
      let query = client.from("training_recommendations")
        .select("id,status,payload").eq("coach_id",coachId);
      query = groupId ? query.eq("group_id",groupId) : query.is("group_id",null);
      const { data, error } = await query.order("created_at",{ascending:false});
      if (error) throw error;
      return (data ?? []).map((row) => ({
        id: String(row.id),
        status: row.status as StoredRecommendation["status"],
        recommendation: row.payload as unknown as PracticeRecommendation,
      }));
    },
    async updateRecommendationStatus(coachId, id, status) {
      const { data, error } = await client.from("training_recommendations")
        .update({ status, updated_at:new Date().toISOString() })
        .eq("coach_id",coachId).eq("id",id).select("id").maybeSingle();
      if (error) throw error;
      return data !== null;
    },
  };
}
