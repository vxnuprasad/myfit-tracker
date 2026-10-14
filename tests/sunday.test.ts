import test from "node:test"; import assert from "node:assert/strict";
import { seed } from "../lib/seed"; import { DB } from "../lib/types";
import { applyLeave, idxFor, isFixedRest, isSkipped, migrateSundayRest, planFor } from "../lib/util";
import { deferExercise } from "../lib/workout";

const add = (d: string, n: number) => { const x = new Date(d + "T12:00:00Z"); x.setUTCDate(x.getUTCDate() + n); return x.toISOString().slice(0, 10); };
const dow = (d: string) => new Date(d + "T12:00:00Z").getUTCDay();
const MON = "2026-10-05", fresh = (): DB => structuredClone(seed);
const GYM = ["Hybrid Push", "Hybrid Pull", "Quad-Focused Legs", "Upper Body", "Glute & Hamstring-Focused Legs"];

test("Sunday is Rest on a fresh install", () => { const db = fresh(); for (let w = 0; w < 104; w++) { const d = add(MON, w * 7 + 6); assert.ok(isFixedRest(db, d)); assert.equal(planFor(db, d).exercises.length, 0); } });

test("Sunday stays Rest after ANY Leave on ANY weekday, for a year", () => {
  for (let k = 0; k < 7; k++) { // leave on each weekday
    let db = fresh(); const d0 = add(MON, k); if (planFor(db, d0).exercises.length) db = applyLeave(db, d0);
    for (let i = 0; i < 365; i++) { const d = add(MON, i); if (dow(d) === 0) assert.equal(planFor(db, d).exercises.length, 0, `Sunday ${d} (leave ${d0})`); }
  }
});

test("Rotation is never reset, skipped or duplicated around Sunday (many Leaves)", () => {
  let db = fresh();
  for (const n of [0, 2, 8, 9, 15, 17]) { const d = add(MON, n); db = applyLeave(db, d); }   // some leaves are no-ops on rest days / Sundays
  const seen: string[] = []; for (let i = 0; i < 70; i++) { const d = add(MON, i); if (isSkipped(db, d)) continue; const p = planFor(db, d); if (p.exercises.length) seen.push(p.day); }
  // Each non-skipped gym day follows the strict Push -> Pull -> Legs -> Upper -> Glute order, continuing across weeks.
  const start = GYM.indexOf(seen[0]); assert.ok(start >= 0);
  seen.forEach((n, i) => assert.equal(n, GYM[(start + i) % 5], `position ${i}`));
});

test("Leave cannot be pressed on Sunday and never creates a Sunday workout", () => {
  const db = fresh(), sun = add(MON, 6); assert.equal(applyLeave(db, sun), db);
  const l = applyLeave(db, MON); assert.equal(applyLeave(l, sun), l);
});

test("Pending exercises never create or move into a Sunday gym session", () => {
  const sat = add(MON, 5), db = fresh();
  const w = { id: "sat", date: sat, day: "Glute & Hamstring-Focused Legs", notes: "", exercises: [{ name: "Leg Press", sets: [{ n: 1, kg: 100, reps: 10, done: true, ts: "t" }, { n: 2, kg: 0, reps: 0, done: false, ts: "" }] }] };
  db.workouts = [deferExercise(w, 0, "now")];
  const sun = add(MON, 6), before = JSON.stringify(db.workouts);
  assert.equal(planFor(db, sun).exercises.length, 0);        // schedule unaffected by pending state
  assert.equal(JSON.stringify(db.workouts), before);         // nothing auto-created, nothing moved
  assert.equal(db.workouts.filter(x => x.date === sun).length, 0);
  assert.equal(db.workouts[0].exercises[0].pending, true);    // record preserved
  assert.equal(db.workouts[0].date, sat);                     // historical date untouched
});

test("Migration of existing data: rotation continues unchanged up to today; Sundays after today are Rest; history untouched", () => {
  const old = fresh(); delete old.settings.sundayRestFrom;                       // data saved before this feature
  old.settings.leaves = { [add(MON, 2)]: "Quad-Focused Legs" };                   // a Leave on Wednesday made Sunday a gym day in the old model
  old.workouts = [{ id: "keep", date: add(MON, 1), day: "Hybrid Pull", notes: "n", finished: true, exercises: [] }];
  const legacy = (d: string) => planFor(old, d).day;                              // old behaviour (rule inactive without the field)
  const today = add(MON, 3);                                                      // Thursday
  assert.equal(legacy(add(MON, 6)), "Glute & Hamstring-Focused Legs");            // old model: gym on Sunday
  const m = migrateSundayRest(old, today); assert.deepEqual(m.keys, ["settings"]);
  assert.equal(m.db.settings.sundayRestFrom, today);
  assert.deepEqual(m.db.workouts, old.workouts); assert.deepEqual(m.db.program, old.program);
  for (let i = 0; i <= 3; i++) assert.equal(planFor(m.db, add(MON, i)).day, legacy(add(MON, i)));   // up to and incl. today: identical
  assert.equal(planFor(m.db, add(MON, 4)).day, legacy(add(MON, 4))); assert.equal(planFor(m.db, add(MON, 5)).day, legacy(add(MON, 5)));
  assert.equal(planFor(m.db, add(MON, 6)).day, "Rest");                           // Sunday is now fixed Rest
  assert.equal(planFor(m.db, add(MON, 7)).day, "Glute & Hamstring-Focused Legs"); // the displaced workout runs Monday, not lost
  assert.equal(migrateSundayRest(m.db, add(MON, 40)).keys.length, 0);             // idempotent
  assert.equal(m.db.settings.leaves![add(MON, 2)], "Quad-Focused Legs");          // existing Leave kept
});

test("fresh seed already has the Sunday rule; idxFor stays within 0..6 and JSON round-trips", () => {
  const db = applyLeave(fresh(), MON), back = JSON.parse(JSON.stringify(db)) as DB;
  assert.ok(db.settings.sundayRestFrom);
  for (let i = 0; i < 60; i++) { const d = add(MON, i); assert.ok(idxFor(db, d) >= 0 && idxFor(db, d) <= 6); assert.equal(planFor(back, d).day, planFor(db, d).day); }
});
