import { ExLog, SetLog, Workout } from "./types";

/** An exercise that still needs work right now: not skipped, not deferred (machine in use) and at least one set not done. */
export const isOpenEx = (e: ExLog) => !e.skipped && !e.pending && e.sets.some(s => !s.done);
/** Existing completion rule: every planned set is done. Deferring/resuming/navigating never changes this. */
export const isCompleteEx = (e: ExLog) => !e.skipped && e.sets.length > 0 && e.sets.every(s => s.done);

/** Indices of deferred exercises, always in the original planned order (so the list never reorders the plan). */
export const pendingIdx = (w: Pick<Workout, "exercises">) => w.exercises.flatMap((e, i) => (e.pending && !e.skipped ? [i] : []));

/** Next exercise to work on after `from`: forward first, then wrap to earlier unfinished ones. Returns exercises.length when none remain. */
export function nextOpenIndex(exs: ExLog[], from: number): number {
  for (let i = from + 1; i < exs.length; i++) if (isOpenEx(exs[i])) return i;
  for (let i = 0; i < from && i < exs.length; i++) if (isOpenEx(exs[i])) return i;
  return exs.length;
}
/** Index to show when a workout is (re)opened: first unfinished, non-deferred exercise; exercises.length if none (summary / pending list). */
export const firstOpenIndex = (exs: ExLog[]) => { const i = exs.findIndex(isOpenEx); return i >= 0 ? i : exs.length; };
/** Plain "next" after finishing an exercise: the following exercise that is not deferred (deferred ones wait in Pending). */
export function nextNonPendingIndex(exs: ExLog[], from: number): number { let i = from + 1; while (i < exs.length && exs[i].pending) i++; return i; }

/** Machine In Use. Only flags the exercise: sets, weights, reps, notes and identity (array position) are untouched. Idempotent => no duplicates. */
export function deferExercise(w: Workout, i: number, nowIso: string): Workout {
  const e = w.exercises[i];
  if (!e || e.pending || e.skipped || w.finished) return w;
  return { ...w, exercises: w.exercises.map((x, k) => (k === i ? { ...x, pending: true, deferredAt: nowIso } : x)) };
}
/** Resume Exercise. Clears only the deferral flag; never marks anything done. */
export function resumeExercise(w: Workout, i: number): Workout {
  const e = w.exercises[i];
  if (!e || !e.pending) return w;
  return { ...w, exercises: w.exercises.map((x, k) => { if (k !== i) return x; const { pending: _p, deferredAt: _d, ...rest } = x; void _p; void _d; return rest; }) };
}

/** Most recently completed set of an exercise (latest timestamp; later position wins ties or missing timestamps). */
export function lastDoneSet(sets: SetLog[]): SetLog | null {
  let best: { s: SetLog; i: number } | null = null;
  sets.forEach((s, i) => { if (s.done && (!best || (s.ts || "") >= (best.s.ts || ""))) best = { s, i }; });
  return best ? (best as { s: SetLog }).s : null;
}
/**
 * Repeat Set: copy weight and reps of the last completed set into the next not-done set (the set-entry form). Nothing is saved or
 * completed here; the user still confirms with the normal Complete Set action. Returns null when unavailable.
 */
export function repeatIntoNextSet(sets: SetLog[]): { sets: SetLog[]; from: SetLog; into: number } | null {
  const from = lastDoneSet(sets), into = sets.findIndex(s => !s.done);
  if (!from || into < 0) return null;
  return { from, into, sets: sets.map((s, k) => (k === into ? { ...s, kg: from.kg, reps: from.reps } : s)) };
}
export const repeatState = (sets: SetLog[]): "ready" | "no-previous" | "all-logged" =>
  !sets.some(s => s.done) ? "no-previous" : sets.every(s => s.done) ? "all-logged" : "ready";
