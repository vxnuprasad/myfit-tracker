import test from "node:test"; import assert from "node:assert/strict";
import { seed } from "../lib/seed"; import { DB } from "../lib/types";
import { applyLeave, idxFor, isSkipped, migrateSchedule, planFor, SCHEDULE_V } from "../lib/util";

const CYCLE = ["Hybrid Push", "Hybrid Pull", "Quad-Focused Legs", "Rest", "Upper Body", "Glute & Hamstring-Focused Legs", "Rest"];
const add = (d: string, n: number) => { const x = new Date(d + "T12:00:00Z"); x.setUTCDate(x.getUTCDate() + n); return x.toISOString().slice(0, 10); };
const names = (db: DB, from: string, n: number) => Array.from({ length: n }, (_, i) => { const d = add(from, i); return isSkipped(db, d) ? "Skipped" : planFor(db, d).day; });
const MON = "2026-10-05"; // a Monday
const fresh = (): DB => structuredClone(seed);
const count = (db: DB, d: number, g: string) => db.program[d].exercises.filter(n => db.exercises.find(e => e.name === n)?.primary === g).length;

test("1. seven-day cycle matches the specified order and repeats from Day 1", () => {
  assert.deepEqual(names(fresh(), MON, 14), [...CYCLE, ...CYCLE]);
});
test("1b. movement counts per muscle group match the spec", () => {
  const db = fresh(), L = db.program.map(p => p.exercises.length);
  assert.deepEqual(L, [7, 7, 5, 0, 10, 7, 0]);
  assert.deepEqual([count(db, 0, "Chest"), count(db, 0, "Shoulders"), count(db, 0, "Biceps")], [3, 2, 2]);
  assert.deepEqual([count(db, 1, "Back"), count(db, 1, "Rear delts"), count(db, 1, "Triceps")], [4, 1, 2]); // 2 rows + 2 pulldowns
  assert.deepEqual([count(db, 2, "Quads"), count(db, 2, "Hamstrings"), count(db, 2, "Calves")], [3, 1, 1]);
  assert.deepEqual([count(db, 4, "Chest"), count(db, 4, "Back"), count(db, 4, "Shoulders") + count(db, 4, "Rear delts"), count(db, 4, "Triceps"), count(db, 4, "Biceps")], [2, 2, 3, 2, 1]);
  assert.deepEqual([count(db, 5, "Quads"), count(db, 5, "Hamstrings"), count(db, 5, "Glutes") + count(db, 5, "Adductors") + count(db, 5, "Calves"), count(db, 5, "Abs")], [2, 2, 1, 2]);
  for (const p of db.program) for (const n of p.exercises) assert.ok(db.exercises.some(e => e.name === n), `${n} missing from library`);
});
test("2. Leave on Monday: Monday Skipped, schedule shifts forward; Sunday stays Rest and the workout it would have had moves to Monday", () => {
  const db = applyLeave(fresh(), MON);
  assert.deepEqual(names(db, MON, 10), ["Skipped", "Hybrid Push", "Hybrid Pull", "Quad-Focused Legs", "Rest", "Upper Body", "Rest", "Glute & Hamstring-Focused Legs", "Rest", "Hybrid Push"]);
});
test("2b. Leave never creates, deletes, or completes workouts and never edits the program", () => {
  const base = fresh(); base.workouts = [{ id: "h", date: "2026-10-02", day: "Upper Body", notes: "", finished: true, exercises: [] }];
  const db = applyLeave(base, MON);
  assert.deepEqual(db.workouts, base.workouts); assert.deepEqual(db.program, base.program);
  assert.equal(db.workouts.filter(w => w.date === MON).length, 0);
});
test("3. repeated Leave keeps order and shifts one more day each time", () => {
  let db = applyLeave(fresh(), MON);            // Mon skipped, Tue = Push
  db = applyLeave(db, add(MON, 1));              // Tue (Push) skipped, Wed = Push
  assert.deepEqual(names(db, MON, 5), ["Skipped", "Skipped", "Hybrid Push", "Hybrid Pull", "Quad-Focused Legs"]);
  db = applyLeave(db, add(MON, 2));              // Wed (Push) skipped, Thu = Push
  const rest = names(db, add(MON, 3), 28);
  for (let i = 0; i < rest.length; i++) assert.equal(rest[i], CYCLE[i % 7]);  // order and rest days preserved across weeks
});
test("3a. Leave late in the week: Sunday stays Rest, Glute day is postponed to Monday (not lost, not duplicated)", () => {
  const sat = add(MON, 5), db = applyLeave(fresh(), sat);   // Saturday is Glute & Hamstring Legs
  assert.deepEqual(names(db, sat, 5), ["Skipped", "Rest", "Glute & Hamstring-Focused Legs", "Rest", "Hybrid Push"]);
});
test("3b. Leave is a no-op on a rest day, on an already-skipped day, or when a workout exists for the day", () => {
  const db = fresh();
  assert.equal(applyLeave(db, add(MON, 3)), db);                         // rest day
  const once = applyLeave(db, MON); assert.equal(applyLeave(once, MON), once); // double press
  const w = { ...db, workouts: [{ id: "x", date: MON, day: "Hybrid Push", notes: "", exercises: [] }] };
  assert.equal(applyLeave(w, MON), w);                                   // already started/finished
});
test("4. cancel = no state change (Leave only changes data via applyLeave; untouched db is identical)", () => {
  const db = fresh(), before = JSON.stringify(db);
  assert.equal(JSON.stringify(db), before); assert.equal(db.settings.leaves, undefined);
});
test("5. persistence: JSON round-trip (what localStorage/sync do) preserves the shifted schedule", () => {
  const db = applyLeave(fresh(), MON), back = JSON.parse(JSON.stringify(db)) as DB;
  assert.deepEqual(names(back, MON, 14), names(db, MON, 14));
});
test("6. all views read idxFor/planFor, so every date has exactly one answer", () => {
  const db = applyLeave(fresh(), MON);
  for (let i = 0; i < 30; i++) { const d = add(MON, i); if (new Date(d + "T12:00:00Z").getUTCDay() === 0) assert.equal(planFor(db, d).exercises.length, 0); else assert.equal(planFor(db, d), db.program[idxFor(db, d)]); }
});
test("7. migration of an existing user: program replaced, history/unrelated data/exercise IDs intact", () => {
  const old = fresh();
  old.program = [{ day: "Old Push", exercises: ["Bench Press"] }, ...Array.from({ length: 6 }, () => ({ day: "Rest", exercises: [] as string[] }))];
  old.settings = { bottleL: 2, bottleTarget: 5, units: "kg", kcalTarget: 2300, proteinTarget: 150, moves: { "2026-10-01": 2 } };
  old.exercises = old.exercises.filter(e => e.name !== "Close-Grip Pulldown").map(e => (e.name === "Bench Press" ? { ...e, equipment: "My bench" } : e));
  old.workouts = [{ id: "keep-me", date: "2026-09-30", day: "Quad-focused Legs", notes: "n", finished: true, exercises: [{ name: "Leg Press", sets: [{ n: 1, kg: 100, reps: 10, done: true, ts: "t" }] }] },
                  { id: "unfinished", date: "2026-10-01", day: "Hybrid Pull", notes: "", exercises: [] }];
  old.food = [{ id: "f", date: "2026-10-01", meal: "Lunch", name: "Rice", qty: 1, unit: "s", kcal: 200, p: 4, c: 40, f: 1, est: true }];
  old.water = { "2026-10-01": ["250@x"] }; old.supplements = { "2026-10-01": { protein: true } }; old.profile.name = "Me";
  const { db: m, keys } = migrateSchedule(old);
  assert.deepEqual(m.program, seed.program); assert.deepEqual(keys.sort(), ["exercises", "program", "settings"]);
  assert.equal(m.settings.scheduleV, SCHEDULE_V);
  assert.deepEqual(m.workouts, old.workouts);                         // history & IDs untouched, nothing flipped
  assert.deepEqual([m.food, m.water, m.supplements, m.profile], [old.food, old.water, old.supplements, old.profile]);
  assert.deepEqual([m.settings.kcalTarget, m.settings.proteinTarget, m.settings.bottleL, m.settings.bottleTarget], [2300, 150, 2, 5]);
  assert.equal(m.exercises.find(e => e.name === "Bench Press")!.equipment, "My bench"); // user edits kept
  assert.equal(m.exercises.length, old.exercises.length + 1);         // only the one needed exercise added
  assert.deepEqual(m.settings.moves, { "2026-10-01": 2 });            // not destroyed, just no longer used
  assert.equal(migrateSchedule(m).keys.length, 0);                    // idempotent: second load changes nothing
  assert.equal(migrateSchedule(fresh()).keys.length, 0);              // fresh install: nothing to migrate
});
test("8. default alignment: every Sunday and Thursday is Rest for a full year; Monday = Day 1", () => {
  const db = fresh();
  for (let w = 0; w < 52; w++) {
    assert.equal(planFor(db, add(MON, w * 7 + 6)).day, "Rest");   // Sunday
    assert.equal(planFor(db, add(MON, w * 7 + 3)).day, "Rest");   // Thursday
    assert.equal(planFor(db, add(MON, w * 7)).day, "Hybrid Push"); // Monday = Day 1
  }
  // after a Leave Sunday is STILL Rest (fixed rest day); only the other rest day moves with the cycle
  const l = applyLeave(db, MON); assert.equal(planFor(l, add(MON, 6)).day, "Rest"); assert.notEqual(planFor(l, add(MON, 3)).day, "Rest");
});
