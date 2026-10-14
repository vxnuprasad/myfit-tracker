import test from "node:test"; import assert from "node:assert/strict";
import { SetLog, Workout } from "../lib/types"; import { DB } from "../lib/types"; import { seed } from "../lib/seed";
import { deferExercise, firstOpenIndex, isCompleteEx, lastDoneSet, nextNonPendingIndex, nextOpenIndex, pendingIdx, repeatIntoNextSet, repeatState, resumeExercise } from "../lib/workout";
import { setSupplement } from "../lib/supplements";

const set = (n: number, kg: number, reps: number, done: boolean, ts = ""): SetLog => ({ n, kg, reps, done, ts, note: done ? `note${n}` : undefined });
const wk = (): Workout => ({ id: "w1", date: "2026-10-12", day: "Hybrid Push", notes: "keep", startedAt: "s", exercises: [
  { name: "Bench Press", sets: [set(1, 60, 10, true, "2026-10-12T10:00:00Z"), set(2, 60, 8, true, "2026-10-12T10:03:00Z"), set(3, 0, 0, false)] },
  { name: "Chest Press", sets: [set(1, 0, 0, false), set(2, 0, 0, false), set(3, 0, 0, false)] },
  { name: "Cable Fly", sets: [set(1, 0, 0, false), set(2, 0, 0, false), set(3, 0, 0, false)] }] });

test("Machine In Use flags only that exercise; sets, notes, weights, reps, identity and order stay intact; nothing is completed", () => {
  const w = wk(), d = deferExercise(w, 0, "T");
  assert.equal(d.exercises[0].pending, true); assert.equal(d.exercises[0].deferredAt, "T");
  assert.deepEqual(d.exercises[0].sets, w.exercises[0].sets); assert.equal(d.exercises[0].name, "Bench Press");
  assert.deepEqual(d.exercises.map(e => e.name), w.exercises.map(e => e.name)); assert.equal(d.exercises.length, 3); assert.equal(d.id, "w1"); assert.equal(d.finished, undefined);
  assert.equal(isCompleteEx(d.exercises[0]), false); assert.equal(d.exercises[0].skipped, undefined);
  assert.equal(w.exercises[0].pending, undefined); // input not mutated
});
test("deferring again never duplicates: idempotent, one pending entry per exercise", () => {
  const once = deferExercise(wk(), 1, "T1"), twice = deferExercise(once, 1, "T2"); assert.equal(twice, once);
  assert.deepEqual(pendingIdx(twice), [1]); assert.equal(twice.exercises.length, 3);
});
test("cannot defer skipped exercises, unknown indexes, or a finished workout", () => {
  const s = wk(); s.exercises[1].skipped = true; assert.equal(deferExercise(s, 1, "T"), s); assert.equal(deferExercise(s, 9, "T"), s);
  const f = { ...wk(), finished: true }; assert.equal(deferExercise(f, 0, "T"), f);
});
test("pending list keeps the original planned order", () => { let w = wk(); w = deferExercise(w, 2, "a"); w = deferExercise(w, 0, "b"); assert.deepEqual(pendingIdx(w), [0, 2]); });
test("next appropriate unfinished exercise: forward first, skipping pending/skipped/complete, wrapping around, else 'none'", () => {
  let w = wk(); w = deferExercise(w, 1, "T");
  assert.equal(nextOpenIndex(w.exercises, 0), 2);                       // skips pending Chest Press
  w = deferExercise(w, 2, "T"); assert.equal(nextOpenIndex(w.exercises, 2), 0);   // wraps to unfinished Bench Press
  w = deferExercise(w, 0, "T"); assert.equal(nextOpenIndex(w.exercises, 0), 3);   // nothing left: = length -> pending list screen
  assert.equal(firstOpenIndex(w.exercises), 3);
  assert.equal(nextNonPendingIndex(wk().exercises.map((e, i) => (i === 1 ? { ...e, pending: true } : e)), 0), 2);
});
test("Resume Exercise restores the exact exercise with all sets, clears only the flag, never completes it", () => {
  const d = deferExercise(wk(), 0, "T"), r = resumeExercise(d, 0);
  assert.equal(r.exercises[0].pending, undefined); assert.equal("deferredAt" in r.exercises[0], false); assert.deepEqual(r.exercises[0].sets, wk().exercises[0].sets);
  assert.equal(isCompleteEx(r.exercises[0]), false); assert.equal(resumeExercise(r, 0), r);   // resuming a non-pending exercise is a no-op
  const again = deferExercise(r, 0, "T3"); assert.deepEqual(pendingIdx(again), [0]); assert.deepEqual(again.exercises[0].sets, wk().exercises[0].sets); // defer again, no data lost
});
test("pending state survives a JSON round trip (what refresh / storage does)", () => { const d = deferExercise(wk(), 1, "T"), back = JSON.parse(JSON.stringify(d)) as Workout; assert.deepEqual(pendingIdx(back), [1]); assert.equal(JSON.stringify(back.exercises[1].sets), JSON.stringify(d.exercises[1].sets)); });
test("completion rule is unchanged: complete only when every set is done", () => {
  const w = wk(); assert.equal(isCompleteEx(w.exercises[0]), false); w.exercises[0].sets[2] = set(3, 55, 6, true, "x"); assert.equal(isCompleteEx(w.exercises[0]), true);
  assert.equal(isCompleteEx(deferExercise(w, 0, "T").exercises[0]), true); // deferring a finished exercise does not un-complete it (the UI never offers it)
});

test("Repeat Set copies the last completed set's weight and reps into the NEXT set-entry form only", () => {
  const w = wk(), r = repeatIntoNextSet(w.exercises[0].sets)!;
  assert.equal(r.into, 2); assert.equal(r.from.n, 2); assert.equal(r.sets[2].kg, 60); assert.equal(r.sets[2].reps, 8);
  assert.equal(r.sets[2].done, false);                                   // NOT saved: the user still confirms with Complete Set
  assert.equal(r.sets[2].n, 3);                                           // correct next set number
  assert.deepEqual(r.sets[0], w.exercises[0].sets[0]); assert.deepEqual(r.sets[1], w.exercises[0].sets[1]);   // originals unchanged
  assert.equal(r.sets.length, 3); assert.equal(r.sets.filter(s => s.done).length, 2);                       // count unchanged: nothing counted twice
  assert.equal(w.exercises[0].sets[2].kg, 0);                            // input not mutated
});
test("Repeat Set values can still be edited, and calling it twice is idempotent (no duplicate records)", () => {
  const s = wk().exercises[0].sets, a = repeatIntoNextSet(s)!, b = repeatIntoNextSet(a.sets)!;
  assert.deepEqual(a.sets, b.sets); assert.equal(b.sets.length, s.length);
  const edited = a.sets.map((x, i) => (i === 2 ? { ...x, kg: 62.5 } : x)); assert.equal(edited[2].kg, 62.5); assert.equal(edited[1].kg, 60);
});
test("Repeat Set availability: unavailable with no previous set; unavailable once all target sets are logged", () => {
  assert.equal(repeatIntoNextSet(wk().exercises[1].sets), null); assert.equal(repeatState(wk().exercises[1].sets), "no-previous");
  const all = [set(1, 20, 12, true, "a"), set(2, 20, 12, true, "b"), set(3, 20, 12, true, "c")]; assert.equal(repeatIntoNextSet(all), null); assert.equal(repeatState(all), "all-logged");
  assert.equal(repeatState(wk().exercises[0].sets), "ready");
});
test("Repeat uses the MOST RECENT completed set (by timestamp, even after an earlier set is redone)", () => {
  const s = [set(1, 20, 12, true, "2026-10-12T10:10:00Z"), set(2, 30, 8, true, "2026-10-12T10:00:00Z"), set(3, 0, 0, false)];
  assert.equal(lastDoneSet(s)!.n, 1); assert.equal(repeatIntoNextSet(s)!.sets[2].kg, 20);
  assert.equal(lastDoneSet([set(1, 1, 1, false)]), null);
});
test("spec example: Set 1 = 20 kg x 12 -> Repeat -> Set 2 form = 20 kg x 12", () => {
  const r = repeatIntoNextSet([set(1, 20, 12, true, "t"), set(2, 0, 0, false), set(3, 0, 0, false)])!; assert.deepEqual([r.sets[1].n, r.sets[1].kg, r.sets[1].reps, r.sets[1].done], [2, 20, 12, false]);
});

test("supplements: Taken / Not taken / clear are date-specific and independent", () => {
  const db: DB = structuredClone(seed), D1 = "2026-10-11", D2 = "2026-10-12";
  let d = setSupplement(db, D1, "protein", true); d = setSupplement(d, D1, "creatine", false); d = setSupplement(d, D2, "protein", false);
  assert.deepEqual(d.supplements![D1], { protein: true, creatine: false }); assert.deepEqual(d.supplements![D2], { protein: false });
  const fixed = setSupplement(d, D2, "protein", true); assert.equal(fixed.supplements![D2].protein, true);         // correction
  const cleared = setSupplement(fixed, D2, "protein", undefined); assert.equal("protein" in cleared.supplements![D2], false);
  assert.deepEqual(cleared.supplements![D1], { protein: true, creatine: false });                                  // history untouched
  assert.equal(setSupplement(db, "2026-10-13", "creatine", true).supplements!["2026-10-13"].protein, undefined);   // a new day starts unrecorded
  assert.deepEqual(db.supplements, {});                                                                            // input not mutated
});
