// Home self-workout timer (5 or 10 minutes): pure, timestamp-based logic (no React, no intervals), so it is easy to test.
// Time is NEVER counted by ticking. A running timer stores the absolute end time (endAt); the remaining time is always
// endAt - Date.now(), so throttled/background tabs, minimised browsers and page reloads cannot make it drift.
const MIN = 60 * 1000;
export const DURATION_OPTIONS_MIN = [5, 10] as const;
export const DEFAULT_DURATION_MS = 5 * MIN;
export const MAX_DURATION_MS = 10 * MIN;
export const isValidDuration = (n: unknown): n is number => typeof n === "number" && DURATION_OPTIONS_MIN.some(m => m * MIN === n);
export const TIMER_KEY = "myfit-selftimer";
export type TimerStatus = "idle" | "running" | "paused" | "completed";
export type TimerState = {
  v: 1; status: TimerStatus;
  durationMs: number;    // selected length (5 or 10 min). Kept in every state, so the choice survives Stop / refresh / completion
  date: string;          // local day (YYYY-MM-DD) the session was started
  endAt?: number;        // running only: absolute epoch ms when the countdown reaches zero
  remainingMs: number;   // paused: frozen remaining time. Others: informational
  completedAt?: number;
  alerted?: boolean;     // completion alert already shown (persisted, so refresh/remount/another tab never repeats it)
};
export const idleWith = (durationMs: number): TimerState => ({ v: 1, status: "idle", date: "", durationMs, remainingMs: durationMs });
export const IDLE: TimerState = idleWith(DEFAULT_DURATION_MS);

export const remainingMs = (s: TimerState, now: number) =>
  s.status === "running" ? Math.min(s.durationMs, Math.max(0, (s.endAt ?? 0) - now)) : s.status === "paused" ? Math.min(s.durationMs, Math.max(0, s.remainingMs)) : s.status === "completed" ? 0 : s.durationMs;
/** Display seconds: rounds up so a fresh timer reads its full length and 00:00 only appears once it has really finished. Never negative. */
export const displaySeconds = (ms: number) => Math.max(0, Math.ceil(ms / 1000));
export const fmtClock = (ms: number) => { const t = displaySeconds(ms); return `${String(Math.floor(t / 60)).padStart(2, "0")}:${String(t % 60).padStart(2, "0")}`; };

/** Choose 5 or 10 minutes. Only possible when no session is active (idle or completed); a running/paused timer is never changed. */
export const selectDuration = (s: TimerState, durationMs: number): TimerState =>
  (s.status === "idle" || s.status === "completed") && isValidDuration(durationMs) ? idleWith(durationMs) : s;
export const startTimer = (now: number, date: string, durationMs: number = DEFAULT_DURATION_MS): TimerState => {
  const d = isValidDuration(durationMs) ? durationMs : DEFAULT_DURATION_MS;
  return { v: 1, status: "running", date, durationMs: d, endAt: now + d, remainingMs: d };
};
const complete = (s: TimerState, now: number): TimerState => ({ v: 1, status: "completed", date: s.date, durationMs: s.durationMs, remainingMs: 0, completedAt: Math.min(now, s.endAt ?? now), alerted: false });

/** Moves a running timer whose end time has passed into "completed". justCompleted is true only for that single transition. */
export function reconcile(s: TimerState, now: number): { state: TimerState; justCompleted: boolean } {
  if (s.status === "running" && now >= (s.endAt ?? 0)) return { state: complete(s, now), justCompleted: true };
  return { state: s, justCompleted: false };
}
export function pauseTimer(s: TimerState, now: number): TimerState {
  if (s.status !== "running") return s;
  const r = reconcile(s, now); if (r.justCompleted) return r.state;
  return { v: 1, status: "paused", date: s.date, durationMs: s.durationMs, remainingMs: remainingMs(s, now) };
}
/** Resume continues from the frozen remaining time; it never restarts at the full duration. */
export function resumeTimer(s: TimerState, now: number): TimerState {
  if (s.status !== "paused" || s.remainingMs <= 0) return s;
  return { v: 1, status: "running", date: s.date, durationMs: s.durationMs, endAt: now + s.remainingMs, remainingMs: s.remainingMs };
}
/** Stop / reset: back to idle, keeping the selected duration. */
export const resetTimer = (s: TimerState = IDLE): TimerState => idleWith(s.durationMs);
export const markAlerted = (s: TimerState): TimerState => (s.status === "completed" ? { ...s, alerted: true } : s);

/** Validates whatever is in storage (corrupt, hand-edited, older shape) and returns a safe state. Also applies day rules. */
export function sanitizeTimer(raw: unknown, now: number, today: string): TimerState {
  if (!raw || typeof raw !== "object") return IDLE;
  const r = raw as Record<string, unknown>, st = r.status, date = typeof r.date === "string" ? r.date : "";
  const dur = isValidDuration(r.durationMs) ? r.durationMs : DEFAULT_DURATION_MS, idle = idleWith(dur);
  const num = (v: unknown) => (typeof v === "number" && Number.isFinite(v) ? v : NaN);
  let s: TimerState;
  if (st === "running") {
    const endAt = num(r.endAt);
    if (!Number.isFinite(endAt) || endAt - now > dur + 5000) return idle; // impossible end time (clock change / bad data / older 14-minute session)
    s = { v: 1, status: "running", date, durationMs: dur, endAt, remainingMs: dur };
  } else if (st === "paused") {
    const rem = num(r.remainingMs); if (!Number.isFinite(rem) || rem <= 0 || rem > dur) return idle;
    s = { v: 1, status: "paused", date, durationMs: dur, remainingMs: rem };
  } else if (st === "completed") {
    s = { v: 1, status: "completed", date, durationMs: dur, remainingMs: 0, completedAt: Number.isFinite(num(r.completedAt)) ? (r.completedAt as number) : undefined, alerted: r.alerted === true };
  } else return idle;
  // A paused or finished session from an earlier day is not today's warm-up. A running one is allowed to finish.
  if (s.status !== "running" && s.date !== today) return idle;
  return reconcile(s, now).state;
}
