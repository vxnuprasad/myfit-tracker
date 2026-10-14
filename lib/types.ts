export type SetLog = { n: number; kg: number; reps: number; rpe?: number; note?: string; done: boolean; ts: string };
export type ExLog = { name: string; skipped?: boolean; /* machine in use: deferred, not completed, not skipped */ pending?: boolean; deferredAt?: string; sets: SetLog[] };
export type Workout = { id: string; date: string; day: string; exercises: ExLog[]; notes: string; finished?: boolean; prep?: { warm?: { kind: string; sec: number; status: "done" | "skipped" }; stretch?: { sec: number; status: "done" | "skipped" } }; startedAt?: string; finishedAt?: string };
export type WeightEntry = { date: string; kg: number; waist?: number; note?: string };
export type DB = {
  profile: { name: string; dob: string; heightCm: number; startKg: number; goalKg: number };
  settings: { bottleL: number; bottleTarget: number; units: "kg" | "lb"; kcalTarget?: number; proteinTarget?: number; carbTarget?: number; fatTarget?: number; waterTargetMl?: number; checkinDay?: number; moves?: Record<string, number>; /* deprecated: ignored since the cycle scheduler; kept untouched so old data is not destroyed */ cycleStart?: string; leaves?: Record<string, string>; scheduleV?: number; proteinCheckin?: boolean; creatineCheckin?: boolean; /* Sundays on/after this date are always rest days (set once by migrateSundayRest) */ sundayRestFrom?: string };
  weight: WeightEntry[];
  water: Record<string, string[]>;
  workouts: Workout[];
  exercises: { name: string; primary: string; secondary?: string; equipment?: string; notes?: string }[];
  waist: { date: string; cm: number }[];
  // Food logging was removed from the UI. These fields are kept (never deleted) so old data, backups and cloud sync stay intact.
  food: FoodEntry[];
  foodLib: FoodItem[];
  // Repeating 7-day cycle (index 0 = Day 1). Dates are mapped onto it by lib/util.ts idxFor().
  program: { day: string; exercises: string[] }[];
  // Daily supplement check-ins keyed by YYYY-MM-DD. Optional so older backups still load.
  supplements?: Record<string, { protein?: boolean; creatine?: boolean }>;
};
export type Meal = "Breakfast" | "Lunch" | "Dinner" | "Snacks";
export type Macros = { kcal: number; p: number; c: number; f: number };
// Macros are for the logged quantity. est=true means user-estimated (not from a label/database).
export type FoodEntry = Macros & { id: string; date: string; meal: Meal; name: string; qty: number; unit: string; est: boolean; note?: string };
// Library macros are per `per` units (e.g. per 100 g or per 1 piece).
export type FoodItem = Macros & { id: string; name: string; unit: string; per: number; est: boolean; fav?: boolean };
