import type { FixedWarmupBlock } from "./types";

/**
 * Locked Training Plan #1 warm-up, 24:15 total.
 * Individual times are seconds, never rounded to whole minutes.
 */
export const APPROVED_WARMUP: FixedWarmupBlock[] = [
  {
    id: "warmup-skipping",
    title: "Skipping → 2 Blocks → Backward Run ×3",
    seconds: 75,
    role: "prepare",
    locked: true,
    coachingCues: ["קצב רגליים", "חזרה בשליטה"],
  },
  {
    id: "warmup-hopping",
    title: "Hopping → 2 Block Falls → Backward Run ×3",
    seconds: 90,
    role: "prepare",
    locked: true,
    coachingCues: ["נחיתה מאוזנת"],
  },
  {
    id: "warmup-lunge",
    title: "Lunge + Rotation → Hamstring Scoop → 20 Shoulder Taps ×3",
    seconds: 150,
    role: "prepare",
    locked: true,
    coachingCues: ["טווח תנועה נשלט"],
  },
  {
    id: "warmup-hydrants",
    title: "Fire Hydrants → Leg Swings → Calf Raises ×3",
    seconds: 180,
    role: "prepare",
    locked: true,
    coachingCues: ["הנעת מפרקים"],
  },
  {
    id: "warmup-holds",
    title: "Lunge Hold → Plank Hold → Deep Squat Hold ×3",
    seconds: 540,
    role: "prepare",
    locked: true,
    coachingCues: ["יציבות ונשימה"],
  },
  {
    id: "warmup-shuffle",
    title: "Shuffle Steps → Closing Block → Fall",
    seconds: 120,
    role: "prepare",
    locked: true,
    coachingCues: ["תנועה הצידה", "סגירה מאוזנת"],
  },
  {
    id: "warmup-partner",
    title: "Partner Warm-Up",
    seconds: 300,
    role: "prepare",
    locked: true,
    coachingCues: ["תקשורת", "הכנה עם כדור"],
  },
];
