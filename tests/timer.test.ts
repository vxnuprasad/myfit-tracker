import test from "node:test"; import assert from "node:assert/strict";
import { DEFAULT_DURATION_MS, DURATION_OPTIONS_MIN, IDLE, displaySeconds, fmtClock, idleWith, isValidDuration, markAlerted, pauseTimer, reconcile, remainingMs, resetTimer, resumeTimer, sanitizeTimer, selectDuration, startTimer } from "../lib/timer";

const T0 = 1_760_000_000_000, D = "2026-10-12", SEC = 1000, MIN = 60 * SEC;

test("only 5 and 10 minutes are selectable; 5 is the default", () => {
  assert.deepEqual([...DURATION_OPTIONS_MIN], [5, 10]); assert.equal(DEFAULT_DURATION_MS, 5 * MIN); assert.equal(IDLE.durationMs, 5 * MIN); assert.equal(fmtClock(remainingMs(IDLE, T0)), "05:00");
  assert.ok(isValidDuration(5 * MIN) && isValidDuration(10 * MIN)); for (const bad of [14 * MIN, 0, -1, NaN, "5", null, 7 * MIN]) assert.equal(isValidDuration(bad), false);
});
test("selecting a duration changes the idle countdown; nothing starts until Start", () => {
  const s = selectDuration(IDLE, 10 * MIN); assert.equal(s.status, "idle"); assert.equal(fmtClock(remainingMs(s, T0)), "10:00"); assert.equal(s.endAt, undefined);
  assert.equal(selectDuration(s, 14 * MIN), s);                            // invalid length ignored
  assert.equal(fmtClock(remainingMs(selectDuration(s, 5 * MIN), T0)), "05:00");
});
test("duration cannot change while running or paused (a session is never altered)", () => {
  const r = startTimer(T0, D, 10 * MIN), p = pauseTimer(r, T0 + MIN);
  assert.equal(selectDuration(r, 5 * MIN), r); assert.equal(selectDuration(p, 5 * MIN), p);
  const c = reconcile(r, T0 + 10 * MIN).state; assert.equal(selectDuration(c, 5 * MIN).status, "idle");   // after completion a new length can be picked
});

for (const m of [5, 10]) {
  const DUR = m * MIN;
  test(`${m} min: a new session starts at exactly ${m}:00 and uses the selected length`, () => { const s = startTimer(T0, D, DUR); assert.equal(s.status, "running"); assert.equal(s.durationMs, DUR); assert.equal(s.endAt, T0 + DUR); assert.equal(fmtClock(remainingMs(s, T0)), `${String(m).padStart(2, "0")}:00`); });
  test(`${m} min: wall-clock remaining stays exact across a long no-tick gap`, () => { const s = startTimer(T0, D, DUR); assert.equal(fmtClock(remainingMs(s, T0 + 2 * MIN + 18 * SEC)), fmtClock(DUR - 2 * MIN - 18 * SEC)); assert.equal(reconcile(s, T0 + DUR - 1).justCompleted, false); });
  test(`${m} min: pause freezes, resume continues (never restarts)`, () => {
    const p = pauseTimer(startTimer(T0, D, DUR), T0 + 90 * SEC); assert.equal(p.durationMs, DUR); assert.equal(remainingMs(p, T0 + 99 * MIN), DUR - 90 * SEC);
    const r = resumeTimer(p, T0 + 20 * MIN); assert.equal(remainingMs(r, T0 + 20 * MIN), DUR - 90 * SEC); assert.equal(r.endAt, T0 + 20 * MIN + DUR - 90 * SEC);
  });
  test(`${m} min: completes exactly once at the selected duration, never negative`, () => {
    const s = startTimer(T0, D, DUR), a = reconcile(s, T0 + DUR); assert.equal(a.justCompleted, true); assert.equal(a.state.alerted, false); assert.equal(a.state.durationMs, DUR);
    const b = reconcile(a.state, T0 + DUR + 5 * MIN); assert.equal(b.justCompleted, false); assert.equal(b.state, a.state);
    assert.equal(remainingMs(a.state, T0 + 99 * MIN), 0); assert.equal(fmtClock(remainingMs(s, T0 + 99 * MIN)), "00:00");
    assert.equal(fmtClock(remainingMs(s, T0 + DUR - 1)), "00:01");
  });
  test(`${m} min: simulated refresh restores running / paused / completed correctly`, () => {
    const s = startTimer(T0, D, DUR), run = sanitizeTimer(JSON.parse(JSON.stringify(s)), T0 + MIN, D); assert.equal(run.status, "running"); assert.equal(run.durationMs, DUR); assert.equal(remainingMs(run, T0 + MIN), DUR - MIN);
    const p = pauseTimer(s, T0 + MIN), pp = sanitizeTimer(JSON.parse(JSON.stringify(p)), T0 + 99 * MIN, D); assert.equal(pp.status, "paused"); assert.equal(remainingMs(pp, T0 + 999 * MIN), DUR - MIN);
    const late = sanitizeTimer(JSON.parse(JSON.stringify(s)), T0 + DUR + 3 * MIN, D); assert.equal(late.status, "completed"); assert.equal(late.alerted, false); assert.equal(late.completedAt, T0 + DUR);
    const done = markAlerted(late), back = sanitizeTimer(JSON.parse(JSON.stringify(done)), T0 + DUR + 4 * MIN, D); assert.equal(back.alerted, true);
  });
}

test("the chosen length survives Stop, a refresh of an idle timer, and a stale day", () => {
  const s = startTimer(T0, D, 10 * MIN); assert.equal(resetTimer(s).durationMs, 10 * MIN); assert.equal(resetTimer(s).status, "idle");
  assert.equal(sanitizeTimer(JSON.parse(JSON.stringify(idleWith(10 * MIN))), T0, D).durationMs, 10 * MIN);
  const stale = sanitizeTimer(pauseTimer(startTimer(T0, "2026-10-11", 10 * MIN), T0 + MIN), T0, D); assert.equal(stale.status, "idle"); assert.equal(stale.durationMs, 10 * MIN);
});
test("pause/resume are no-ops in the wrong state; pausing at/after the end completes", () => {
  const s = startTimer(T0, D, 5 * MIN); assert.equal(resumeTimer(s, T0 + MIN), s); assert.equal(pauseTimer(IDLE, T0), IDLE);
  assert.equal(pauseTimer(s, T0 + 5 * MIN + 1).status, "completed");
});
test("corrupt, impossible or old 14-minute data becomes a safe idle state (default 5 min)", () => {
  for (const bad of [null, "x", 5, {}, { status: "running" }, { status: "running", endAt: "soon" }, { status: "running", endAt: T0 + 14 * MIN, durationMs: 5 * MIN }, { status: "running", endAt: T0 + 13 * MIN }, { status: "paused", remainingMs: -4 }, { status: "paused", remainingMs: 99 * MIN, date: D }, { status: "wat" }]) {
    const r = sanitizeTimer(bad, T0, D); assert.equal(r.status, "idle"); assert.equal(r.durationMs, 5 * MIN);
  }
  assert.equal(displaySeconds(-1), 0);
});
