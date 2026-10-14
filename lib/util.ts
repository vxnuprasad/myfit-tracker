import { DB } from "./types";
import { seed } from "./seed";
export function generateId(): string {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") return crypto.randomUUID();
  return `${Date.now()}-${Math.random().toString(36).slice(2)}-${Math.random().toString(36).slice(2)}`;
}
// ---------------------------------------------------------------------------
// Schedule: the ONE source of truth for "what is planned on date X".
// db.program is a repeating 7-day cycle (index 0 = Day 1). A date maps to
//   (whole days since cycleStart  -  number of earlier "Leave" presses) mod 7.
// cycleStart defaults to a Monday, so Day 1 falls on Mondays until a Leave shifts things.
// A date in settings.leaves is Skipped: it keeps its planned slot, and every later date moves back one slot
// (i.e. the whole remaining schedule shifts forward one calendar day). Nothing is ever deleted or rewritten.
// Sunday is a FIXED rest day (settings.sundayRestFrom): planFor() always returns Rest for it. If the rotation would have put a
// workout on that Sunday, the workout is postponed to Monday (it is not dropped, duplicated or moved by pending exercises).
// ---------------------------------------------------------------------------
export const SCHEDULE_V = 1;
export const CYCLE_START = "2024-01-01"; // a Monday
export const DAY_NAMES = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
const dayNum = (ds: string) => { const [y, m, d] = ds.split("-").map(Number); return Math.round(Date.UTC(y, m - 1, d) / 86400000); };
export const isSkipped = (db: DB, date: string) => !!db.settings.leaves && Object.prototype.hasOwnProperty.call(db.settings.leaves, date);
const dowOf = (ds: string) => { const [y, m, d] = ds.split("-").map(Number); return new Date(Date.UTC(y, m - 1, d)).getUTCDay(); };
const mod7 = (n: number) => ((n % 7) + 7) % 7;
const REST_PLAN: { day: string; exercises: string[] } = { day: "Rest", exercises: [] };
/** Sunday is a fixed gym rest day (from settings.sundayRestFrom onward; earlier Sundays keep their history untouched). */
export const isFixedRest = (db: DB, date: string) => { const from = db.settings.sundayRestFrom; return !!from && date >= from && dowOf(date) === 0; };
/**
 * Number of cycle slots "used up" before `date` without advancing the rotation.
 *  - every Leave before `date` (existing behaviour), and
 *  - every fixed-rest Sunday whose cycle slot was a workout: that workout is postponed to Monday instead of being dropped
 *    or duplicated. A Sunday whose slot is already a rest slot consumes it normally, so the default Mon-Sat split is unchanged.
 */
const shiftBefore = (db: DB, date: string) => {
  const leaves = Object.keys(db.settings.leaves ?? {}).filter(l => l < date), from = db.settings.sundayRestFrom;
  if (!from || date <= from) return leaves.length;
  const lv = new Set(leaves), ev = new Set(leaves), start = dayNum(db.settings.cycleStart ?? CYCLE_START);
  const f = new Date(from + "T12:00:00Z"); f.setUTCDate(f.getUTCDate() + ((7 - f.getUTCDay()) % 7)); // first Sunday on/after `from`
  for (let s = f.toISOString().slice(0, 10); s < date; f.setUTCDate(f.getUTCDate() + 7), s = f.toISOString().slice(0, 10)) ev.add(s);
  let shift = 0;
  for (const e of [...ev].sort()) {
    if (lv.has(e)) { shift++; continue; }
    if (db.program[mod7(dayNum(e) - start - shift)]?.exercises.length) shift++;
  }
  return shift;
};
export const idxFor = (db: DB, date: string) => mod7(dayNum(date) - dayNum(db.settings.cycleStart ?? CYCLE_START) - shiftBefore(db, date));
export const planFor = (db: DB, date: string) => (isFixedRest(db, date) ? REST_PLAN : db.program[idxFor(db, date)]);
/** Leave: marks `date` Skipped (never Completed) and shifts the rest of the schedule forward one day. No-op if not allowed. */
export function applyLeave(d: DB, date: string): DB {
  const p = planFor(d, date);
  if (!p.exercises.length || isSkipped(d, date) || d.workouts.some(w => w.date === date)) return d;
  return { ...d, settings: { ...d.settings, leaves: { ...d.settings.leaves, [date]: p.day } } };
}
/**
 * One-time, non-destructive migration for data saved before the fixed Sunday rest day existed.
 * Records the date from which Sunday is always Rest. Rotation up to that date is untouched, so nothing is reset or skipped.
 */
export function migrateSundayRest(db: DB, todayStr: string): { db: DB; keys: (keyof DB)[] } {
  if (db.settings.sundayRestFrom) return { db, keys: [] };
  return { db: { ...db, settings: { ...db.settings, sundayRestFrom: todayStr } }, keys: ["settings"] };
}
/** One-time reset to the gym cycle. Existing workouts, exercise IDs/names and all unrelated data are untouched. */
export function migrateSchedule(db: DB): { db: DB; keys: (keyof DB)[] } {
  if ((db.settings.scheduleV ?? 0) >= SCHEDULE_V) return { db, keys: [] };
  const have = new Set(db.exercises.map(e => e.name)), used = new Set(seed.program.flatMap(p => p.exercises));
  return {
    db: { ...db, program: seed.program.map(p => ({ ...p, exercises: [...p.exercises] })),
      exercises: [...db.exercises, ...seed.exercises.filter(e => used.has(e.name) && !have.has(e.name))],
      settings: { ...db.settings, scheduleV: SCHEDULE_V } },
    keys: ["program", "exercises", "settings"],
  };
}
